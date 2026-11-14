"""Mengubah SOP contoh menjadi PDF dan DOCX.

    python3 scripts/buat-contoh-sop.py       # menulis .docx dan /tmp/kursus/sop.html
    # lalu cetak HTML-nya jadi PDF lewat Playwright yang sudah terpasang.

Sumbernya selalu `docs/contoh/sop-izin-dan-cuti.md`. Berkas .pdf dan .docx
dibuat ulang dari situ, supaya ketiganya tidak pernah berbeda isi. Keduanya ada
karena yang akan menonton demo membawa PDF atau Word, bukan Markdown.

Baris lanjutan yang menjorok DISATUKAN lebih dulu ke butir sebelumnya. Tanpa
itu daftar bernomor terputus di tengah dan butir sesudahnya mulai lagi dari 1 --
terlihat jelas di cetakan, dan dokumen demo tidak boleh punya cacat seperti itu.
"""
import pathlib, re, html as H, zipfile
from xml.sax.saxutils import escape

mentah = re.sub(r"^> .*\n", "", pathlib.Path("docs/contoh/sop-izin-dan-cuti.md").read_text(), flags=re.M)

gabung = []
for l in mentah.split("\n"):
    if re.match(r"^\s{2,}\S", l) and gabung and gabung[-1].strip():
        gabung[-1] = gabung[-1].rstrip() + " " + l.strip()
    else:
        gabung.append(l)
baris = gabung
NOMOR = re.compile(r"^\d+\. ")

def potong(l):
    return [c.strip() for c in l.strip("|").split("|")]

def blok(fp, fh2, fh1, ftab, ful, fol):
    out, i = [], 0
    while i < len(baris):
        l = baris[i]
        if l.startswith("# "): out.append(fh1(l[2:]))
        elif l.startswith("## "): out.append(fh2(l[3:]))
        elif l.startswith("|"):
            t = []
            while i < len(baris) and baris[i].startswith("|"):
                t.append(baris[i]); i += 1
            out.append(ftab([potong(r) for r in t if not set(r) <= set("|-: ")])); continue
        elif re.match(r"^[-*] ", l):
            li = []
            while i < len(baris) and re.match(r"^[-*] ", baris[i]):
                li.append(baris[i][2:]); i += 1
            out.append(ful(li)); continue
        elif NOMOR.match(l):
            li = []
            while i < len(baris) and NOMOR.match(baris[i]):
                li.append(NOMOR.sub("", baris[i])); i += 1
            out.append(fol(li)); continue
        elif l.strip(): out.append(fp(l))
        i += 1
    return out

# ---------- HTML untuk PDF ----------
def ih(t):
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", H.escape(t))
html = blok(
    lambda t: "<p>" + ih(t) + "</p>",
    lambda t: "<h2>" + ih(t) + "</h2>",
    lambda t: "<h1>" + ih(t) + "</h1>",
    lambda rows: "<table><thead><tr>" + "".join("<th>" + ih(c) + "</th>" for c in rows[0]) + "</tr></thead><tbody>"
        + "".join("<tr>" + "".join("<td>" + ih(c) + "</td>" for c in r) + "</tr>" for r in rows[1:]) + "</tbody></table>",
    lambda li: "<ul>" + "".join("<li>" + ih(x) + "</li>" for x in li) + "</ul>",
    lambda li: "<ol>" + "".join("<li>" + ih(x) + "</li>" for x in li) + "</ol>",
)
gaya = """<!doctype html><meta charset="utf-8"><style>
body { font-family: Georgia, "Times New Roman", serif; font-size: 10.5pt; line-height: 1.55; color: #111; }
h1 { font-size: 16pt; margin: 0 0 2mm; }
h1 + p { color: #444; font-size: 9pt; border-bottom: 1px solid #bbb; padding-bottom: 4mm; margin-bottom: 7mm; }
h2 { font-size: 11.5pt; margin: 7mm 0 2mm; border-left: 3px solid #333; padding-left: 3mm; }
p, li { margin: 0 0 2.5mm; }
ul, ol { margin: 0 0 3mm; padding-left: 7mm; }
table { border-collapse: collapse; width: 100%; margin: 0 0 4mm; font-size: 9.5pt; }
th, td { border: 1px solid #999; padding: 1.8mm 2.5mm; text-align: left; vertical-align: top; }
th { background: #eee; }
table, ul, ol { break-inside: avoid; }
</style>"""
pathlib.Path("/tmp/kursus/sop.html").write_text(gaya + "\n".join(html))

# ---------- DOCX ----------
def runs(t):
    keluar = []
    for b in re.split(r"(\*\*.+?\*\*)", t):
        if not b: continue
        tebal = b.startswith("**") and b.endswith("**")
        rpr = "<w:rPr><w:b/></w:rPr>" if tebal else ""
        keluar.append('<w:r>' + rpr + '<w:t xml:space="preserve">' + escape(b[2:-2] if tebal else b) + "</w:t></w:r>")
    return "".join(keluar)

def wp(t, gaya=None, num=None):
    ppr = ('<w:pStyle w:val="%s"/>' % gaya if gaya else "") + (
        '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="%d"/></w:numPr>' % num if num else "")
    return "<w:p>" + ("<w:pPr>" + ppr + "</w:pPr>" if ppr else "") + runs(t) + "</w:p>"

def wsel(t, head=False):
    sh = '<w:shd w:val="clear" w:fill="EEEEEE"/>' if head else ""
    bord = "".join('<w:%s w:val="single" w:sz="6" w:color="999999"/>' % s for s in ("top","left","bottom","right"))
    return "<w:tc><w:tcPr><w:tcBorders>" + bord + "</w:tcBorders>" + sh + "</w:tcPr>" + wp(("**%s**" % t) if head else t) + "</w:tc>"

def wtab(rows):
    x = '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>'
    for n, r in enumerate(rows):
        x += "<w:tr>" + "".join(wsel(c, n == 0) for c in r) + "</w:tr>"
    return x + "</w:tbl>" + wp("")

body = blok(
    lambda t: wp(t),
    lambda t: wp(t, "Heading2"),
    lambda t: wp(t, "Heading1"),
    wtab,
    lambda li: "".join(wp(x, "ListParagraph", 1) for x in li),
    lambda li: "".join(wp(x, "ListParagraph", 2) for x in li),
)
NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
def absnum(i, fmt, t):
    return ('<w:abstractNum w:abstractNumId="%d"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="%s"/>'
            '<w:lvlText w:val="%s"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>'
            "</w:lvl></w:abstractNum>" % (i, fmt, t))
with zipfile.ZipFile("docs/contoh/sop-izin-dan-cuti.docx", "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>')
    z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
    z.writestr("word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>')
    z.writestr("word/document.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + "><w:body>" + "".join(body) + "</w:body></w:document>")
    z.writestr("word/numbering.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ' + NS + ">" + absnum(0, "bullet", "•") + absnum(1, "decimal", "%1.") + '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>')
print("siap")

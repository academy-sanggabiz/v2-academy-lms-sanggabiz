import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Keluaran `vercel build`. Ada di .gitignore, tapi ESLint tidak membaca
    // .gitignore -- tanpa baris ini satu kali `vercel build` untuk mendiagnosis
    // deploy membuat `npm run lint` melaporkan ribuan galat dari kode yang
    // bukan milik kita.
    ".vercel/**",
  ]),
]);

export default eslintConfig;

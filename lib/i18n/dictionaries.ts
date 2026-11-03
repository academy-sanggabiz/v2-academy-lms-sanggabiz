import type { Locale } from "@/lib/i18n/config"

/**
 * Kamus antarmuka. Satu berkas, bukan satu berkas per bahasa, supaya kalimat
 * Indonesia dan Inggris berdampingan: terjemahan yang tertinggal langsung
 * terlihat saat menyunting, dan TypeScript menolak kunci yang hilang di salah
 * satu bahasa.
 *
 * Yang **tidak** ada di sini: isi kursus. Judul pelajaran, materi, dan soal
 * ditulis pengajar dan tersimpan di basis data. Menerjemahkannya berarti kolom
 * terjemahan per baris -- pekerjaan tersendiri (docs/BACKLOG.md).
 */
export type Dictionary = {
  common: {
    skipToContent: string
    save: string
    cancel: string
    saving: string
    language: string
    changeLanguage: string
    optional: string
  }
  nav: {
    dashboard: string
    courses: string
    purchases: string
    notifications: string
    profile: string
    settings: string
    signOut: string
  }
  auth: {
    signInTitle: string
    signInSubtitle: string
    email: string
    password: string
    showPassword: string
    forgotPassword: string
    signIn: string
    signingIn: string
    orContinueWith: string
    continueWithGoogle: string
    noAccount: string
    register: string
    emailPlaceholder: string
    redirecting: string
  }
  settings: {
    title: string
    notifications: string
    emailNotifications: string
    emailNotificationsHint: string
    emailOn: string
    emailOff: string
    security: string
    changePassword: string
    newPasswordPlaceholder: string
    passwordSaved: string
    deleteAccount: string
    deleteAccountHint: string
    deleteAccountWarning: string
    deletingAccount: string
  }
  signup: {
    title: string
    subtitle: string
    fullName: string
    fullNameHelp: string
    emailHelp: string
    passwordHelp: string
    submit: string
    submitting: string
    checkEmail: string
    haveAccount: string
    signIn: string
    redirecting: string
  }
  forgot: {
    title: string
    subtitle: string
    submit: string
    submitting: string
    checkEmail: string
    sentTo: string
    sentHint: string
    checkSpam: string
    backToSignIn: string
    rememberPassword: string
  }
  newPassword: {
    title: string
    newPassword: string
    repeatPassword: string
    mismatch: string
  }
  dashboard: {
    greeting: string
    coursesInProgress: string
    coursesCompleted: string
    ofEnrolled: string
    keepGoing: string
    lessonsCompleted: string
    certificates: string
    readyToDownload: string
    continueLearning: string
    nextLesson: string
    lessonsDone: string
    continueAt: string
    noneInProgress: string
    recommended: string
    noRecommendations: string
    start: string
    continue: string
    learners: string
    of: string
    lessonsProgress: string
  }
  courses: {
    searchPlaceholder: string
    searchLabel: string
    sort: string
    newest: string
    title: string
    priceLowest: string
    all: string
    enrolled: string
    completed: string
    noneEnrolled: string
    noneCompleted: string
    noMatches: string
    preview: string
    lessons: string
    hours: string
  }
  purchases: {
    title: string
    subtitle: string
    totalSpent: string
    purchases: string
    paid: string
    allPurchases: string
    course: string
    amount: string
    status: string
    date: string
    none: string
    noMatches: string
    searchLabel: string
    filterLabel: string
    statusPaid: string
    statusFree: string
    statusPending: string
    statusRefunded: string
    allStatuses: string
  }
  notifications: {
    all: string
    title: string
    subtitle: string
    empty: string
    emptyHint: string
  }
  pagination: {
    /** `{from}`, `{to}`, `{total}` diganti angka saat dipakai. */
    showing: string
    loading: string
  }
  enroll: {
    join: string
    continueLearning: string
    startLearning: string
    enrolledStartLearning: string
  }
  nearGoal: {
    /** `{modul}` nama modul, `{n}` jumlah pelajaran, `{menit}` perkiraan menit. */
    start: string
    /** Seperti `start`, dipakai saat data durasi modul kosong. */
    startNoTime: string
    /** `{modul}`, `{selesai}`, `{n}`. */
    resume: string
  }
  kpi: {
    title: string
    noTarget: string
    defLearners: string
    defCourses: string
    defCompletionRate: string
    defCompleted: string
    defEnrollments: string
    defTrackedEnrollments: string
    defAvgModulePct: string
  }
  adaptive: {
    suggestTitle: string
    /** `{soal}` cuplikan soal, `{n}` jumlah salah. */
    struggled: string
    reason: string
    freedom: string
  }
  tracking: {
    cardTitle: string
    cardHint: string
    collected: string
    purpose: string
    notDone: string
    storedLabel: string
    whoSeesLabel: string
    allow: string
    stateOn: string
    stateUndecided: string
    stateOff: string
    nudgeTitle: string
    nudgeBody: string
    nudgeAction: string
    nudgeDismiss: string
    collectedItems: string[]
    purposeItems: string[]
    notDoneItems: string[]
    storage: string
    whoSees: string
    withdrawal: string
  }
  grading: {
    backToGrading: string
    attemptsPendingReview: string
    matrixSubtitle: string
    searchCourses: string
    searchLearners: string
    colAttempts: string
    open: string
    noCourseMatches: string
    courseGradeCol: string
    noQuizzes: string
    savingGrades: string
    /** `{maks}` poin maksimum. */
    pointsRange: string
    /** `{n}` jumlah percobaan. */
    attemptsGraded: string
    saveFailedAll: string
    /** `{gagal}` dan `{total}` diganti angka. */
    saveFailedSome: string
    /** `{n}` jumlah percobaan. */
    succeededSummary: string
    /** `{n}` jumlah percobaan. */
    failedSummary: string
    noSubmission: string
    pendingShort: string
    /** `{n}` jumlah sel yang menunggu. */
    pendingCount: string
    provisionalTitle: string
    /** `{nama}` peserta, `{kuis}` judul kuis. */
    gradeAria: string
    /** `{i}` nomor soal, `{nama}` peserta, `{maks}` poin maksimum. */
    pointsAria: string
    previewSubmission: string
    taskInfo: string
    /** `{n}` persen. */
    passScore: string
    /** `{n}` bobot. */
    weightInGrade: string
    untitledQuestion: string
    /** `{n}` jumlah tambahan. */
    moreCount: string
    exportCsv: string
    exporting: string
    csvDownloaded: string
    exportFailedReload: string
    exportFailedNetwork: string
    importGrades: string
    importTitle: string
    importDescription: string
    pickCsv: string
    dropHere: string
    clickToChoose: string
    importing: string
    importingDontClose: string
    /** `{n}` jumlah baris. */
    rowsFailed: string
    done: string
    close: string
    openSubmittedLink: string
  }
  insight: {
    back: string
    dropoffTitle: string
    /** `{total}` peserta terdaftar, `{belum}` yang belum mulai. */
    dropoffSubtitle: string
    mostStopPrefix: string
    /** `{n}` jumlah peserta. */
    mostStopSuffix: string
    scrollFunnel: string
    colLesson: string
    colDone: string
    colStalled: string
    dropoffNotReadyPrefix: string
    behaviorNotReadyPrefix: string
    notReadyMiddle: string
    notReadyEnd: string
    strugglesTitle: string
    strugglesSubtitle: string
    scrollHardest: string
    colQuestion: string
    colCorrect: string
    /** `{benar}` dan `{total}`. */
    ofAnswers: string
    effortTitle: string
    effortSubtitle: string
    scrollEffort: string
    colPassed: string
    colAttemptsToPass: string
    colFirstScore: string
    colBestScore: string
    /** `{lulus}` dan `{total}`. */
    passedOf: string
    /** `{n}` jumlah percobaan. */
    attemptsTotal: string
    nonePassed: string
    average: string
    behaviorTitle: string
    consentPrefix: string
    /** `{total}` seluruh peserta. */
    ofLearners: string
    /** `{n}` yang menolak. */
    declinedSuffix: string
    /** `{n}` yang belum memutuskan. */
    undecidedSuffix: string
    consentTail: string
    noConsentYet: string
    noTimeYet: string
    scrollStudyTime: string
    colLearnersHead: string
    colTotal: string
    colAverage: string
    /** `{n}` detik. */
    seconds: string
    /** `{n}` menit. */
    minutes: string
    /** `{j}` jam, `{m}` menit. */
    hoursMinutes: string
    moduleCompletion: string
    tasksDoneLabel: string
    submittedNote: string
    moduleHead: string
    noLessons: string
    quizzesHead: string
    noQuizzesHere: string
    colScore: string
    colSubmitted: string
    badgeNotStarted: string
    badgeInProgress: string
    badgePendingReview: string
    badgePassed: string
    badgeNotPassed: string
    difficultyTitle: string
    difficultyEmpty: string
    /** `{n}` jumlah soal. */
    nUnmastered: string
    unmasteredRest: string
    allMastered: string
    /** `{salah}` dan `{total}`. */
    wrongOf: string
    finallyCorrect: string
    /** `{judul}` judul pelajaran. */
    openLesson: string
  }
  editor: {
    destructiveTitle: string
    destructivePrefix: string
    /** `{n}` jumlah. */
    nLessons: string
    /** `{n}` jumlah. */
    nQuestions: string
    andWord: string
    destructiveSuffix: string
    keepSaving: string
    newCourse: string
    editCourse: string
    publishedToast: string
    invalidData: string
    noLessonsPublish: string
    /** `{n}` jumlah masalah lain. */
    plusOthers: string
    /** `{n}` jumlah pelajaran lain. */
    plusOtherLessons: string
    leaveTitle: string
    leaveDesc: string
    leave: string
    savingBlockMessage: string
    saveDraft: string
    publish: string
    unsavedChanges: string
    tabBasic: string
    tabLessons: string
    tabSettings: string
    tabLearners: string
    tabPreview: string
    loadingSettings: string
    loadingLearners: string
    statusSavedAt: string
    statusSaved: string
    statusUnsaved: string
    statusError: string
    restoreTitle: string
    /** `{waktu}` keterangan waktu relatif. */
    restoreDesc: string
    restoreStale: string
    discard: string
    restore: string
    justNow: string
    minutesAgo: string
    hoursAgo: string
    daysAgo: string
    labelTitle: string
    phTitle: string
    labelDescription: string
    phDescription: string
    labelRequirements: string
    phRequirements: string
    labelAudience: string
    phAudience: string
    labelThumb: string
    hintThumb: string
    basicSettings: string
    level: string
    pickLevel: string
    levelBeginner: string
    levelIntermediate: string
    levelAdvanced: string
    enrollmentSettings: string
    privateCourse: string
    privateDesc: string
    draftWarnTitle: string
    draftWarnRest: string
    privateNote: string
    publicDesc: string
    paidDesc: string
    priceLabel: string
    pricePh: string
    instructorSettings: string
    seqTitle: string
    seqLabel: string
    seqDesc: string
    seqNotePrefix: string
    seqNoteStrong: string
    seqNoteSuffix: string
    prereqTitle: string
    requirePrereq: string
    requirePrereqDesc: string
    prereqCourses: string
    pickCourse: string
    add: string
    prereqHelp: string
    /** `{judul}` judul kursus. */
    removePrereq: string
    uploading: string
    clickToUpload: string
    /** `{label}` nama gambar. */
    removeImage: string
    certTitle: string
    enableCert: string
    enableCertDesc: string
    passingGradeLabel: string
    passingGradeDesc: string
    certTemplate: string
    certTemplateHint: string
    layoutHead: string
    inheritMain: string
    certTypeHead: string
    customTitleLabel: string
    customTitlePh: string
    certDescLabel: string
    /** `{n}` jumlah karakter terpakai. */
    charCount: string
    certDescPh: string
    tokensSupported: string
    signatureLabel: string
    signatureHint: string
    signatureInheritHas: string
    signatureInheritNone: string
    signerNameLabel: string
    signerNamePh: string
    signerTitleLabel: string
    signerTitlePh: string
    additionalTextLabel: string
    additionalTextPh: string
    inheritedHintPrefix: string
    inheritedEmpty: string
    certTypeCompletion: string
    certTypeCompletionDesc: string
    certTypeParticipation: string
    certTypeParticipationDesc: string
    certTypeAchievement: string
    certTypeAchievementDesc: string
    certTypeCustom: string
    certTypeCustomDesc: string
    certLayoutKlasik: string
    certLayoutKlasikDesc: string
    certLayoutModern: string
    certLayoutModernDesc: string
    certLayoutFormal: string
    certLayoutFormalDesc: string
    noInstructors: string
    selectedMark: string
    /** `{nama}` nama instruktur. */
    deleteNamed: string
    /** `{nama}` nama instruktur. */
    deleteInstructorTitle: string
    deleteInstructorDesc: string
    deleting: string
    deleteWord: string
    addInstructor: string
    nameLabel: string
    bioLabel: string
    creating: string
    create: string
    instructorCreated: string
    instructorDeleted: string
    /** `{n}` total peserta terdaftar. */
    enrolledLearnersCount: string
    enrolledLearners: string
    privateRosterNote: string
    publicRosterNote: string
    inviteLearner: string
    removingLearner: string
    searchEnrolled: string
    noEnrolledYet: string
    noRosterMatches: string
    inviteHintPrefix: string
    inviteHintSuffix: string
    statusDone: string
    statusActive: string
    /** `{nama}` nama peserta. */
    unenrollNamed: string
    /** `{nama}` nama peserta. */
    unenrollTitle: string
    unenrollDesc: string
    unenrolling: string
    unenroll: string
    /** `{nama}` nama peserta. */
    unenrolledToast: string
    enrollingBusy: string
    inviteDesc: string
    searchByNameEmail: string
    searchPh: string
    /** `{n}` jumlah karakter minimum. */
    typeMinChars: string
    searching: string
    allMatchedEnrolled: string
    learnerNotFound: string
    enrolling: string
    enrollVerb: string
    /** `{nama}` nama peserta. */
    enrolledToast: string
    done: string
    /** `{n}` jumlah ulasan. */
    reviewsCount: string
    searchFeedback: string
    noReviews: string
    noReviewMatches: string
    reviewsHint: string
    untitledCourse: string
    noDescription: string
  }
  admin: {
    dashboard: string
    courses: string
    grading: string
    tracking: string
    learners: string
    purchases: string
    mentors: string
    landing: string
    certificates: string
    settings: string
    profile: string
    dashboardSubtitlePlatform: string
    dashboardSubtitleMentor: string
    totalLearners: string
    totalCourses: string
    completionRate: string
    coursesCompleted: string
    myCourses: string
    myLearners: string
    myCompleted: string
    published: string
    coursesSubtitle: string
    createCourse: string
    learnersSubtitle: string
    gradingSubtitle: string
    gradingCoursesTitle: string
    gradingEmpty: string
    trackingSubtitle: string
    trackingEmpty: string
    recentCourses: string
    recentEnrollments: string
    noEnrollments: string
    noEnrollmentsHint: string
    noCourses: string
    noCoursesHint: string
    noNotifications: string
    noNotificationsHint: string
    totalLearnersLabel: string
    coursesCompletedLabel: string
    allLearners: string
    viewAll: string
    totalEnrollmentsLabel: string
    colTitle: string
    colStatus: string
    colDate: string
    colLearner: string
    colCourse: string
    noLearnerMatches: string
    filterAllStatuses: string
    filterDraft: string
    filterAllPrices: string
    filterPublic: string
    filterPaid: string
    filterEnrolled: string
    filterCompleted: string
    searchCourseTitle: string
    searchNameEmail: string
    learnersHeading: string
    colModule: string
    colTask: string
    colTasksDone: string
    colEmail: string
    colActions: string
    colQuiz: string
    /** `{selesai}` dan `{total}` diganti angka. */
    completedOfEnrollments: string
  }
  landing: {
    signIn: string
    getStarted: string
    exploreCourses: string
    footerTagline: string
    privacy: string
  }
  display: {
    title: string
    openPanel: string
    intro: string
    textSize: string
    textSizeDevice: string
    textSizeLarge: string
    textSizeLarger: string
    contrast: string
    contrastDevice: string
    contrastHigh: string
    motion: string
    motionDevice: string
    motionReduced: string
    deviceHint: string
    browserZoomHint: string
  }
  profile: {
    edit: string
    editTitle: string
    backToProfile: string
    enrolledCourses: string
    certificates: string
    noCertificates: string
    certificateBeingMade: string
    download: string
    uploadPhoto: string
    changePhoto: string
    removePhoto: string
    uploading: string
    photoReady: string
    photoRemoved: string
    photoHint: string
    name: string
    nameHint: string
    certificateName: string
    certificateNameHint: string
    organization: string
    organizationHint: string
    phone: string
    phoneHint: string
    emailLocked: string
    saved: string
    saveChanges: string
    joinedSince: string
  }
  player: {
    previousLesson: string
    nextLesson: string
    previous: string
    finishLesson: string
    finishCourse: string
    lessonNavigation: string
    readFullscreen: string
    exitFullscreen: string
    quizComingSoon: string
    lastLessonDone: string
    certificateReady: string
    viewCertificate: string
    findAnotherCourse: string
    almostDone: string
    almostDoneHint: string
    bestScore: string
    notAttempted: string
    passMark: string
    attemptsUsed: string
    attemptsUnlimited: string
    tryAgain: string
    finalGrade: string
    congratulations: string
    reviewInvite: string
    myNotes: string
    notesHint: string
    notesPlaceholder: string
    firstLesson: string
  }
  pageTitles: {
    lesson: string
    newPassword: string
    forgotPassword: string
    admin: string
    coursePreview: string
    myLearning: string
  }
  shell: {
    openMenu: string
    closeMenu: string
    openSidebar: string
    closeSidebar: string
    mainNavigation: string
    signOutFailed: string
    signingOut: string
  }
}

const id: Dictionary = {
  common: {
    skipToContent: "Langsung ke konten utama",
    save: "Simpan",
    cancel: "Batal",
    saving: "Menyimpan…",
    language: "Bahasa",
    changeLanguage: "Ganti bahasa",
    optional: "opsional",
  },
  nav: {
    dashboard: "Dashboard",
    courses: "Kursus",
    purchases: "Pembelian",
    notifications: "Notifikasi",
    profile: "Profil",
    settings: "Pengaturan",
    signOut: "Keluar",
  },
  auth: {
    signInTitle: "Masuk",
    signInSubtitle: "Masuk ke Sanggabiz untuk melanjutkan.",
    email: "Email",
    password: "Kata sandi",
    showPassword: "Tampilkan kata sandi",
    forgotPassword: "Lupa kata sandi?",
    signIn: "Masuk",
    signingIn: "Sedang masuk…",
    orContinueWith: "Atau lanjutkan dengan",
    continueWithGoogle: "Lanjutkan dengan Google",
    noAccount: "Belum punya akun?",
    register: "Daftar",
    emailPlaceholder: "nama@email.com",
    redirecting: "Mengalihkan…",
  },
  settings: {
    title: "Pengaturan",
    notifications: "Notifikasi",
    emailNotifications: "Notifikasi Email",
    emailNotificationsHint:
      "Pilihan Anda tersimpan, tapi pengiriman email belum aktif. Pemberitahuan sementara ini hanya muncul di halaman Notifikasi.",
    emailOn: "Notifikasi email dinyalakan",
    emailOff: "Notifikasi email dimatikan",
    security: "Keamanan",
    changePassword: "Ubah Kata Sandi",
    newPasswordPlaceholder: "Masukkan kata sandi baru",
    passwordSaved: "Kata sandi tersimpan",
    deleteAccount: "Hapus Akun",
    deleteAccountHint: "Hapus akun Anda secara permanen",
    deleteAccountWarning: "Akun yang sudah dihapus tidak dapat dipulihkan",
    deletingAccount: "Menghapus akun…",
  },
  signup: {
    title: "Buat akun Anda",
    subtitle: "Mulai belajar bersama Sanggabiz.",
    fullName: "Nama lengkap",
    fullNameHelp: "Nama ini yang akan tercetak di sertifikat Anda.",
    emailHelp: "Dipakai untuk masuk dan menerima pemberitahuan kursus.",
    passwordHelp: "Minimal 8 karakter.",
    submit: "Daftar",
    submitting: "Mendaftarkan…",
    checkEmail: "Periksa email Anda",
    haveAccount: "Sudah punya akun?",
    signIn: "Masuk",
    redirecting: "Mengalihkan…",
  },
  forgot: {
    title: "Lupa kata sandi",
    subtitle: "Masukkan email akun Anda. Kami kirimkan tautan untuk membuat kata sandi baru.",
    submit: "Kirim tautan",
    submitting: "Mengirim…",
    checkEmail: "Periksa email Anda",
    sentTo: "Jika {email} terdaftar, kami mengirimkan tautan untuk membuat kata sandi baru.",
    sentHint: "Tautannya berlaku sementara.",
    checkSpam: "Tidak ada di kotak masuk? Periksa folder spam.",
    backToSignIn: "Kembali ke halaman masuk",
    rememberPassword: "Ingat kata sandi Anda?",
  },
  newPassword: {
    title: "Buat kata sandi baru",
    newPassword: "Kata sandi baru",
    repeatPassword: "Ulangi kata sandi baru",
    mismatch: "Kedua kata sandi belum sama.",
  },
  dashboard: {
    greeting: "Halo",
    coursesInProgress: "Kursus berjalan",
    coursesCompleted: "Kursus selesai",
    ofEnrolled: "dari {n} diikuti",
    keepGoing: "Pertahankan",
    lessonsCompleted: "Pelajaran tuntas",
    certificates: "Sertifikat",
    readyToDownload: "siap diunduh",
    continueLearning: "Lanjutkan belajar",
    nextLesson: "Berikutnya: pelajaran",
    lessonsDone: "selesai",
    continueAt: "Lanjutkan: pelajaran",
    noneInProgress: "Belum ada kursus yang sedang Anda ikuti.",
    recommended: "Kursus rekomendasi",
    noRecommendations: "Belum ada rekomendasi",
    start: "Mulai",
    continue: "Lanjutkan",
    learners: "Peserta",
    of: "dari",
    lessonsProgress: "pelajaran selesai",
  },
  courses: {
    searchPlaceholder: "Cari kursus...",
    searchLabel: "Cari kursus",
    sort: "Urutkan",
    newest: "Terbaru",
    title: "Judul",
    priceLowest: "Harga: Terendah",
    all: "Semua Kursus",
    enrolled: "Terdaftar",
    completed: "Selesai",
    noneEnrolled: "Anda belum terdaftar di kursus mana pun.",
    noneCompleted: "Anda belum menyelesaikan kursus apa pun.",
    noMatches: "Tidak ada kursus yang cocok dengan pencarian Anda.",
    preview: "Pratinjau",
    lessons: "pelajaran",
    hours: "jam",
  },
  purchases: {
    title: "Riwayat Pembelian",
    subtitle: "Pembelian dan pendaftaran kursus Anda",
    totalSpent: "Total Belanja",
    purchases: "Pembelian",
    paid: "Berbayar",
    allPurchases: "Semua Pembelian",
    course: "Kursus",
    amount: "Jumlah",
    status: "Status",
    date: "Tanggal",
    none: "Belum ada pembelian.",
    noMatches: "Tidak ada pembelian yang cocok dengan pencarian Anda.",
    searchLabel: "Cari berdasarkan kursus",
    filterLabel: "Filter berdasarkan status",
    statusPaid: "Berbayar",
    statusFree: "Gratis",
    statusPending: "Tertunda",
    statusRefunded: "Dikembalikan",
    allStatuses: "Semua Status",
  },
  notifications: {
    all: "Semua notifikasi",
    title: "Notifikasi",
    subtitle: "Semua notifikasi Anda, dari yang terbaru",
    empty: "Belum ada pemberitahuan",
    emptyHint: "Kabar tentang kursus, nilai, dan sertifikat Anda akan muncul di sini.",
  },
  pagination: {
    showing: "Menampilkan {from}–{to} dari {total}",
    loading: "Memuat…",
  },
  enroll: {
    join: "Ikuti kursus",
    continueLearning: "Lanjutkan belajar",
    startLearning: "Mulai belajar",
    enrolledStartLearning: "Terdaftar ✓ Mulai belajar",
  },
  nearGoal: {
    start: "Mulai kecil: {modul} \u2014 {n} pelajaran, \u00B1{menit} menit",
    startNoTime: "Mulai kecil: {modul} \u2014 {n} pelajaran",
    resume: "Tujuan terdekat: {modul} \u2014 {selesai} dari {n} pelajaran selesai",
  },
  kpi: {
    title: "Apa persisnya yang dihitung",
    noTarget:
      "Target belum ditetapkan. Angka tanpa target hanya bisa dilihat, belum bisa dinilai berhasil atau tidaknya \u2014 menetapkannya adalah keputusan pemilik.",
    defLearners:
      "Jumlah orang berbeda yang terdaftar di setidaknya satu kursus dalam lingkup Anda (superadmin: seluruh platform). Satu orang yang mengikuti tiga kursus dihitung satu.",
    defCourses: "Jumlah kursus dalam lingkup Anda, draf maupun terbit. Keterangan kecilnya menyebut berapa yang sudah terbit.",
    defCompletionRate:
      "Pendaftaran berstatus selesai dibagi seluruh pendaftaran, dihitung per pendaftaran dan bukan per orang \u2014 satu orang yang menyelesaikan dua kursus menyumbang dua.",
    defCompleted: "Jumlah pendaftaran yang mencapai status selesai: seluruh pelajaran tuntas dan seluruh kuisnya lulus.",
    defEnrollments: "Jumlah baris pendaftaran pada kursus dalam lingkup Anda. Satu orang di dua kursus dihitung dua.",
    defTrackedEnrollments: "Seluruh pendaftaran pada kursus dalam lingkup Anda, apa pun statusnya.",
    defAvgModulePct:
      "Persentase pelajaran yang sudah diselesaikan, dihitung untuk tiap pendaftaran lalu dirata-rata. Pendaftaran yang belum mulai ikut dihitung sebagai 0%.",
  },
  adaptive: {
    suggestTitle: "Saran sebelum mencoba lagi",
    struggled: "Soal \u201C{soal}\u201D sudah {n} kali terjawab salah.",
    reason: "Karena itu kami menyarankan membuka ulang materinya lebih dulu:",
    freedom: "Ini hanya saran \u2014 Anda tetap bisa langsung mencoba lagi.",
  },
  tracking: {
    cardTitle: "Membantu Memperbaiki Materi",
    cardHint: "Opsional. Menolak tidak mengurangi apa pun yang bisa Anda pakai.",
    collected: "Yang dicatat",
    purpose: "Untuk apa",
    notDone: "Yang tidak dilakukan",
    storedLabel: "Disimpan:",
    whoSeesLabel: "Yang bisa melihat:",
    allow: "Izinkan pencatatan ini",
    stateOn:
      "Sedang dicatat. Mematikannya menghentikan pencatatan dan menghapus data yang sudah terkumpul.",
    stateUndecided: "Belum ada yang dicatat.",
    stateOff: "Tidak dicatat, dan data sebelumnya sudah dihapus.",
    nudgeTitle: "Bantu memperbaiki materi?",
    nudgeBody:
      "Anda bisa mengizinkan pencatatan pelajaran mana yang Anda buka dan berapa lama, untuk memperbaiki materi. Sepenuhnya pilihan — menolak tidak mengurangi apa pun.",
    nudgeAction: "Baca dan putuskan",
    nudgeDismiss: "Nanti saja",
    collectedItems: [
      "Pelajaran yang Anda buka, dan berapa lama halamannya terbuka.",
      "Kursus yang sedang Anda kerjakan beserta waktunya.",
    ],
    purposeItems: [
      "Mengetahui bagian materi mana yang paling sering ditinggalkan, supaya materinya diperbaiki.",
      "Membandingkan satu angkatan dengan angkatan berikutnya.",
    ],
    notDoneItems: [
      "Tidak dipakai untuk menilai Anda, dan tidak memengaruhi nilai maupun kelulusan.",
      "Tidak dipakai membuat keputusan otomatis tentang Anda.",
      "Tidak dibagikan ke pihak di luar Sanggabiz Academy.",
    ],
    storage: "Disimpan paling lama 12 bulan, lalu dihapus otomatis.",
    whoSees: "Hanya superadmin Sanggabiz Academy, dan Anda sendiri.",
    withdrawal:
      "Anda boleh menolak sekarang dan tetap memakai seluruh fitur LMS tanpa terkecuali. Bila sudah menyetujui, Anda bisa menariknya kapan saja — pengumpulan langsung berhenti, dan Anda bisa menghapus data yang sudah terkumpul.",
  },
  grading: {
    backToGrading: "Kembali ke Penilaian",
    attemptsPendingReview: "Percobaan Menunggu Penilaian",
    matrixSubtitle:
      "Semua nilai kuis untuk kursus ini. Sel nilai otomatis hanya dapat dibaca, sel esai perlu dinilai.",
    searchCourses: "Cari kursus...",
    searchLearners: "Cari peserta...",
    colAttempts: "Percobaan",
    open: "Buka",
    noCourseMatches: "Tidak ada kursus yang cocok dengan pencarian Anda.",
    courseGradeCol: "Nilai Kursus",
    noQuizzes: "Kursus ini belum memiliki kuis.",
    savingGrades: "Menyimpan nilai\u2026",
    pointsRange: "Poin harus antara 0 dan {maks}",
    attemptsGraded: "{n} percobaan dinilai",
    saveFailedAll: "Gagal menyimpan nilai. Periksa rinciannya di atas tabel, lalu coba lagi.",
    saveFailedSome:
      "{gagal} dari {total} percobaan gagal dinilai. Periksa rinciannya di atas tabel, lalu coba lagi.",
    succeededSummary: "{n} percobaan berhasil dinilai.",
    failedSummary: "{n} percobaan gagal:",
    noSubmission: "Tidak ada kiriman",
    pendingShort: "menunggu",
    pendingCount: "{n} menunggu",
    provisionalTitle: "Sementara: hanya dari soal yang dinilai otomatis",
    gradeAria: "Nilai {nama} untuk {kuis} (0-100)",
    pointsAria: "Poin soal {i} untuk {nama} (maks. {maks})",
    previewSubmission: "Pratinjau kiriman",
    taskInfo: "Info tugas",
    passScore: "Nilai lulus: {n}%",
    weightInGrade: "Bobot {n}\u00D7 dalam nilai kursus",
    untitledQuestion: "Soal tanpa judul",
    moreCount: "+{n} lainnya",
    exportCsv: "Ekspor CSV Kursus",
    exporting: "Mengekspor\u2026",
    csvDownloaded: "CSV diunduh",
    exportFailedReload: "Gagal mengekspor CSV. Muat ulang halaman, lalu coba lagi.",
    exportFailedNetwork: "Gagal mengekspor CSV. Periksa koneksi Anda, lalu coba lagi.",
    importGrades: "Impor Nilai",
    importTitle: "Impor Nilai dari CSV",
    importDescription:
      "Unggah CSV yang diekspor dari halaman Penilaian ini (dengan nilai esai sudah diisi) untuk menerapkan nilai sekaligus.",
    pickCsv: "Pilih berkas CSV",
    dropHere: "Seret & lepas CSV di sini, atau",
    clickToChoose: "klik untuk memilih berkas",
    importing: "Mengimpor\u2026",
    importingDontClose: "Mengimpor\u2026 Jangan tutup jendela ini sampai impor selesai.",
    rowsFailed: "{n} baris gagal:",
    done: "Selesai",
    close: "Tutup",
    openSubmittedLink: "Buka tautan yang dikirim",
  },
  insight: {
    back: "Kembali",
    dropoffTitle: "Di mana peserta berhenti",
    dropoffSubtitle:
      "Dihitung dari penyelesaian pelajaran yang memang sudah dicatat untuk menjalankan kursus. Dari {total} peserta terdaftar, {belum} belum menyelesaikan satu pelajaran pun.",
    mostStopPrefix: "Paling banyak berhenti di",
    mostStopSuffix: "\u2014 {n} peserta berhenti tepat di sini.",
    scrollFunnel: "Corong penyelesaian pelajaran, dapat digulir mendatar",
    colLesson: "Pelajaran",
    colDone: "Selesai",
    colStalled: "Berhenti di sini",
    dropoffNotReadyPrefix: "Analisis titik berhenti belum aktif: fungsi",
    behaviorNotReadyPrefix: "Pelacakan perilaku belum aktif: fungsi",
    notReadyMiddle: "belum ada di basis data. Jalankan",
    notReadyEnd: "di SQL Editor Supabase.",
    strugglesTitle: "Di mana peserta kesulitan",
    strugglesSubtitle:
      "Dihitung dari jawaban yang sudah masuk, digabung lintas peserta. Soal yang belum pernah dijawab tidak ditampilkan.",
    scrollHardest: "Soal tersulit, dapat digulir mendatar",
    colQuestion: "Soal",
    colCorrect: "Benar",
    ofAnswers: "{benar} dari {total} jawaban",
    effortTitle: "Seberapa berat kuisnya",
    effortSubtitle:
      "Percobaan tidak dibatasi, jadi angka ini menunjukkan berapa kali peserta perlu mengulang sampai paham \u2014 bukan berapa kali ia boleh mencoba.",
    scrollEffort: "Beban kuis, dapat digulir mendatar",
    colPassed: "Lulus",
    colAttemptsToPass: "Percobaan sampai lulus",
    colFirstScore: "Nilai percobaan pertama",
    colBestScore: "Nilai terbaik",
    passedOf: "{lulus} dari {total}",
    attemptsTotal: "{n} percobaan seluruhnya",
    nonePassed: "belum ada yang lulus",
    average: "rata-rata",
    behaviorTitle: "Lama belajar",
    consentPrefix: "Dicatat hanya untuk peserta yang menyetujuinya:",
    ofLearners: "dari {total} peserta",
    declinedSuffix: "({n} menolak)",
    undecidedSuffix: ", {n} belum memutuskan",
    consentTail: "Angka di bawah karena itu menggambarkan kelompok itu saja, bukan seluruh peserta.",
    noConsentYet: "Belum ada peserta yang menyetujui pencatatan, jadi belum ada yang bisa ditampilkan.",
    noTimeYet: "Belum ada waktu belajar yang tercatat.",
    scrollStudyTime: "Lama belajar per kursus, dapat digulir mendatar",
    colLearnersHead: "Peserta",
    colTotal: "Total",
    colAverage: "Rata-rata",
    seconds: "{n} detik",
    minutes: "{n} menit",
    hoursMinutes: "{j} jam {m} menit",
    moduleCompletion: "Penyelesaian Modul",
    tasksDoneLabel: "Tugas dikerjakan",
    submittedNote: "kuis terkirim, lulus atau tidak",
    moduleHead: "Modul",
    noLessons: "Belum ada pelajaran di kursus ini.",
    quizzesHead: "Kuis",
    noQuizzesHere: "Kursus ini tidak memiliki kuis.",
    colScore: "Nilai",
    colSubmitted: "Dikirim",
    badgeNotStarted: "Belum dimulai",
    badgeInProgress: "Sedang dikerjakan",
    badgePendingReview: "Menunggu penilaian",
    badgePassed: "Lulus",
    badgeNotPassed: "Belum lulus",
    difficultyTitle: "Titik kesulitan",
    difficultyEmpty:
      "Belum ada soal yang dijawab salah. Titik kesulitan muncul di sini setelah peserta mengerjakan kuis.",
    nUnmastered: "{n} soal",
    unmasteredRest: "masih belum dikuasai. Tiap baris menautkan ke pelajaran yang mengajarkannya.",
    allMastered: "Semua soal yang sempat salah akhirnya dijawab benar.",
    wrongOf: "Salah {salah} dari {total} kali",
    finallyCorrect: "akhirnya dijawab benar",
    openLesson: "Buka pelajaran: {judul}",
  },
  editor: {
    destructiveTitle: "Penyimpanan ini menghapus konten",
    destructivePrefix: "Menyimpan akan menghapus permanen",
    nLessons: "{n} pelajaran",
    nQuestions: "{n} soal",
    andWord: "dan",
    destructiveSuffix:
      ", termasuk progres peserta atau percobaan kuis yang terkait. Tindakan ini tidak dapat dibatalkan.",
    keepSaving: "Tetap simpan",
    newCourse: "Kursus Baru",
    editCourse: "Ubah Kursus",
    publishedToast: "Kursus diterbitkan",
    invalidData: "Data kursus tidak valid",
    noLessonsPublish: "Kursus belum punya pelajaran. Tambahkan setidaknya satu sebelum menerbitkan.",
    plusOthers: "(+{n} lainnya)",
    plusOtherLessons: "(+{n} pelajaran lain)",
    leaveTitle: "Perubahan belum disimpan",
    leaveDesc: "Ada perubahan yang belum disimpan. Tinggalkan tanpa menyimpan?",
    leave: "Tinggalkan",
    savingBlockMessage: "Penyimpanan sedang berjalan. Tinggalkan halaman tanpa menunggu hasilnya?",
    saveDraft: "Simpan Draf",
    publish: "Terbitkan",
    unsavedChanges: "Perubahan belum disimpan",
    tabBasic: "Info Dasar",
    tabLessons: "Pelajaran",
    tabSettings: "Pengaturan",
    tabLearners: "Peserta",
    tabPreview: "Pratinjau",
    loadingSettings: "Memuat pengaturan\u2026",
    loadingLearners: "Memuat peserta\u2026",
    statusSavedAt: "Tersimpan pukul {waktu}",
    statusSaved: "Tersimpan",
    statusUnsaved: "Belum disimpan",
    statusError: "Gagal menyimpan",
    restoreTitle: "Ditemukan perubahan yang belum disimpan",
    restoreDesc:
      "Ada perubahan dari {waktu} yang belum pernah disimpan. Pulihkan perubahan tersebut, atau buang dan gunakan versi tersimpan?",
    restoreStale:
      "Kursus ini juga sudah berubah di server sejak saat itu. Jika dipulihkan, perubahan di server akan tertimpa saat Anda menyimpan.",
    discard: "Buang",
    restore: "Pulihkan",
    justNow: "baru saja",
    minutesAgo: "{n} menit lalu",
    hoursAgo: "{n} jam lalu",
    daysAgo: "{n} hari lalu",
    labelTitle: "Judul Kursus",
    phTitle: "misal: Pengantar Pengembangan Web",
    labelDescription: "Deskripsi Kursus",
    phDescription: "Apa yang akan peserta dapatkan dari kursus ini?",
    labelRequirements: "Persyaratan",
    phRequirements: "Satu persyaratan per baris",
    labelAudience: "Untuk siapa kursus ini",
    phAudience: "Satu sasaran peserta per baris",
    labelThumb: "Gambar Kursus",
    hintThumb: "PNG atau JPEG, maks. 5MB",
    basicSettings: "Pengaturan Dasar",
    level: "Tingkat",
    pickLevel: "Pilih tingkat",
    levelBeginner: "Pemula",
    levelIntermediate: "Menengah",
    levelAdvanced: "Lanjutan",
    enrollmentSettings: "Pengaturan Pendaftaran",
    privateCourse: "Kursus privat",
    privateDesc:
      "Hanya peserta yang Anda daftarkan yang dapat menemukan atau membuka kursus ini. Kursus tidak tampil di katalog publik. Tambahkan peserta dari tab Peserta.",
    draftWarnTitle: "Kursus ini masih berupa draf.",
    draftWarnRest:
      "Peserta yang diundang belum dapat membukanya sampai Anda menekan Terbitkan. Pengaturan privat hanya mengatur siapa yang dapat menemukannya, bukan apakah kursus sudah tayang.",
    privateNote:
      "Peserta tidak dapat mendaftar sendiri ke kursus privat, jadi opsi harga di bawah hanya berlaku jika nanti kursus dijadikan publik.",
    publicDesc: "Siapa pun dapat mendaftar tanpa biaya.",
    paidDesc: "Peserta membayar harga tetap untuk mendaftar.",
    priceLabel: "Harga",
    pricePh: "Rp 150.000",
    instructorSettings: "Pengaturan Instruktur",
    seqTitle: "Urutan Belajar",
    seqLabel: "Harus berurutan",
    seqDesc:
      "Pelajaran berikutnya baru terbuka setelah yang sebelumnya tuntas. Dimatikan berarti peserta bebas memilih pelajaran mana pun, seperti kebanyakan kursus daring.",
    seqNotePrefix: "Pelajaran kuis baru dianggap tuntas setelah peserta",
    seqNoteStrong: "lulus",
    seqNoteSuffix:
      ", bukan sekadar mencentangnya. Peserta yang sedang berjalan di kursus ini akan ikut terkunci pada pelajaran yang belum mereka tuntaskan.",
    prereqTitle: "Pengaturan Prasyarat",
    requirePrereq: "Wajibkan Prasyarat",
    requirePrereqDesc: "Peserta harus menyelesaikan kursus lain sebelum mendaftar ke kursus ini",
    prereqCourses: "Kursus Prasyarat",
    pickCourse: "Pilih kursus",
    add: "Tambah",
    prereqHelp: "Pilih kursus yang harus diselesaikan peserta sebelum dapat mendaftar ke kursus ini",
    removePrereq: "Hapus prasyarat {judul}",
    uploading: "Mengunggah\u2026",
    clickToUpload: "Klik untuk mengunggah gambar",
    removeImage: "Hapus {label}",
    certTitle: "Pengaturan Sertifikat",
    enableCert: "Aktifkan Sertifikat",
    enableCertDesc: "Terbitkan sertifikat untuk peserta yang menyelesaikan kursus",
    passingGradeLabel: "Nilai Kelulusan (%)",
    passingGradeDesc:
      "Nilai kursus berbobot minimum yang harus dicapai peserta, selain lulus setiap kuis, sebelum kursus dinyatakan selesai dan sertifikat diterbitkan.",
    certTemplate: "Templat Sertifikat (Opsional)",
    certTemplateHint: "Orientasi lanskap, PNG/JPEG, maks. 5MB",
    layoutHead: "Tata Letak",
    inheritMain: "Ikut Pengaturan Utama",
    certTypeHead: "Jenis Sertifikat",
    customTitleLabel: "Judul Sertifikat Khusus",
    customTitlePh: "misal: Sertifikat Keahlian",
    certDescLabel: "Deskripsi Sertifikat",
    charCount: "{n}/150 karakter",
    certDescPh: "misal: Dengan ini menyatakan bahwa [Nama Peserta] telah menyelesaikan [Nama Kursus].",
    tokensSupported: "Penanda yang didukung: [Nama Peserta], [Nama Kursus]",
    signatureLabel: "Unggah Gambar Tanda Tangan",
    signatureHint: "PNG atau JPEG, maks. 1MB",
    signatureInheritHas: "Dikosongkan berarti memakai tanda tangan dari pengaturan utama.",
    signatureInheritNone: "Pengaturan utama juga belum punya gambar tanda tangan.",
    signerNameLabel: "Nama Penanda Tangan",
    signerNamePh: "misal: Budi Santoso",
    signerTitleLabel: "Jabatan Penanda Tangan",
    signerTitlePh: "misal: Instruktur Kursus, Direktur Pendidikan",
    additionalTextLabel: "Teks Tambahan (Opsional)",
    additionalTextPh: "Teks tambahan yang tampil di sertifikat...",
    inheritedHintPrefix: "Ikut pengaturan utama",
    inheritedEmpty: "(belum diisi superadmin)",
    certTypeCompletion: "Kelulusan",
    certTypeCompletionDesc: "\"Sertifikat Kelulusan\" - \"telah berhasil menyelesaikan\"",
    certTypeParticipation: "Partisipasi",
    certTypeParticipationDesc: "\"Sertifikat Partisipasi\" - \"telah berpartisipasi dalam\"",
    certTypeAchievement: "Prestasi",
    certTypeAchievementDesc: "\"Sertifikat Prestasi\" - \"telah berhasil meraih\"",
    certTypeCustom: "Judul Khusus (Opsional)",
    certTypeCustomDesc: "Masukkan judul sertifikat sendiri",
    certLayoutKlasik: "Klasik",
    certLayoutKlasikDesc: "Bingkai ganda, semua rata tengah",
    certLayoutModern: "Modern",
    certLayoutModernDesc: "Pita warna di tepi kiri, teks rata kiri",
    certLayoutFormal: "Formal",
    certLayoutFormalDesc: "Garis tipis, penanda tangan di tengah bawah",
    noInstructors: "Belum ada instruktur. Buat instruktur untuk memulai.",
    selectedMark: "Terpilih \u2713",
    deleteNamed: "Hapus {nama}",
    deleteInstructorTitle: "Hapus \u201C{nama}\u201D?",
    deleteInstructorDesc:
      "Instruktur ini akan dilepas dari semua kursus yang sedang ditanganinya. Tindakan ini tidak dapat dibatalkan.",
    deleting: "Menghapus\u2026",
    deleteWord: "Hapus",
    addInstructor: "Tambah Instruktur",
    nameLabel: "Nama",
    bioLabel: "Biodata",
    creating: "Membuat\u2026",
    create: "Buat",
    instructorCreated: "Instruktur dibuat dan ditetapkan",
    instructorDeleted: "Instruktur dihapus",
    enrolledLearnersCount: "Peserta Terdaftar ({n})",
    enrolledLearners: "Peserta Terdaftar",
    privateRosterNote: "Kursus ini privat, jadi peserta hanya dapat masuk jika didaftarkan di sini.",
    publicRosterNote: "Kursus ini publik, jadi peserta juga dapat mendaftar sendiri.",
    inviteLearner: "Undang peserta",
    removingLearner: "Mengeluarkan peserta\u2026",
    searchEnrolled: "Cari peserta terdaftar...",
    noEnrolledYet: "Belum ada peserta terdaftar",
    noRosterMatches: "Tidak ada peserta yang cocok dengan pencarian Anda",
    inviteHintPrefix: "Gunakan",
    inviteHintSuffix:
      "untuk mencari peserta yang sudah terdaftar di platform dan mendaftarkannya ke kursus ini.",
    statusDone: "Selesai",
    statusActive: "Aktif",
    unenrollNamed: "Keluarkan {nama}",
    unenrollTitle: "Keluarkan {nama}?",
    unenrollDesc:
      "Pendaftaran peserta ini beserta progres belajarnya di kursus ini akan dihapus. Tindakan ini tidak dapat dibatalkan.",
    unenrolling: "Mengeluarkan\u2026",
    unenroll: "Keluarkan",
    unenrolledToast: "{nama} dikeluarkan",
    enrollingBusy: "Mendaftarkan\u2026",
    inviteDesc: "Cari peserta berdasarkan nama atau email, lalu daftarkan ke kursus ini.",
    searchByNameEmail: "Cari peserta berdasarkan nama atau email",
    searchPh: "Nama atau email\u2026",
    typeMinChars: "Ketik minimal {n} karakter untuk mencari.",
    searching: "Mencari\u2026",
    allMatchedEnrolled: "Semua peserta yang cocok sudah terdaftar.",
    learnerNotFound: "Peserta tidak ditemukan.",
    enrolling: "Mendaftarkan\u2026",
    enrollVerb: "Daftarkan",
    enrolledToast: "{nama} didaftarkan",
    done: "Selesai",
    reviewsCount: "{n} ulasan",
    searchFeedback: "Cari nama atau email peserta...",
    noReviews: "Belum ada ulasan",
    noReviewMatches: "Tidak ada ulasan yang cocok dengan pencarian Anda",
    reviewsHint: "Peserta diminta menilai kursus setelah menyelesaikannya.",
    untitledCourse: "Kursus tanpa judul",
    noDescription: "Belum ada deskripsi.",
  },
  admin: {
    dashboard: "Dashboard",
    courses: "Manajemen Kursus",
    grading: "Penilaian",
    tracking: "Pelacakan",
    learners: "Peserta",
    purchases: "Pembelian",
    mentors: "Mentor",
    landing: "Halaman Depan",
    certificates: "Sertifikat",
    settings: "Pengaturan",
    profile: "Profil",
    dashboardSubtitlePlatform: "Ringkasan seluruh platform: peserta, kursus, dan aktivitas terbaru",
    dashboardSubtitleMentor:
      "Ringkasan kursus yang Anda kelola, peserta di dalamnya, dan aktivitas terbaru",
    totalLearners: "Total Peserta",
    totalCourses: "Total Kursus",
    completionRate: "Tingkat Penyelesaian",
    coursesCompleted: "Kursus Selesai",
    myCourses: "Kursus Saya",
    myLearners: "Peserta di Kursus Saya",
    myCompleted: "Selesai di Kursus Saya",
    published: "Terbit",
    coursesSubtitle: "Buat, ubah, dan kelola semua kursus di platform belajar Anda",
    createCourse: "Buat Kursus",
    learnersSubtitle: "Lihat dan kelola semua peserta yang terdaftar di kursus",
    gradingSubtitle:
      "Semua kursus yang memiliki kiriman kuis. Nilai otomatis hanya dapat dibaca, esai perlu dinilai.",
    gradingCoursesTitle: "Kursus dengan Kiriman",
    gradingEmpty: "Belum ada kiriman kuis.",
    trackingSubtitle: "Pantau penyelesaian modul dan tugas setiap peserta per kursus",
    trackingEmpty: "Belum ada pendaftaran.",
    recentCourses: "Kursus Terbaru",
    recentEnrollments: "Pendaftaran Terbaru",
    noEnrollments: "Belum ada peserta yang mendaftar",
    noEnrollmentsHint:
      "Pendaftaran muncul di sini begitu kursus Anda terbit. Anda juga bisa mendaftarkan peserta sendiri.",
    noCourses: "Belum ada kursus",
    noCoursesHint: "Kursus yang Anda buat akan muncul di sini, termasuk yang masih berupa draf.",
    noNotifications: "Belum ada pemberitahuan",
    noNotificationsHint: "Kabar tentang kursus dan sertifikat Anda akan muncul di sini.",
    totalLearnersLabel: "Total Peserta",
    coursesCompletedLabel: "Kursus Selesai",
    allLearners: "Semua Peserta",
    viewAll: "Lihat Semua",
    totalEnrollmentsLabel: "Total Pendaftaran",
    colTitle: "Judul",
    colStatus: "Status",
    colDate: "Tanggal",
    colLearner: "Peserta",
    colCourse: "Kursus",
    noLearnerMatches: "Tidak ada peserta yang cocok dengan pencarian Anda.",
    filterAllStatuses: "Semua status",
    filterDraft: "Draf",
    filterAllPrices: "Semua harga",
    filterPublic: "Publik",
    filterPaid: "Berbayar",
    filterEnrolled: "Terdaftar",
    filterCompleted: "Selesai",
    searchCourseTitle: "Cari judul kursus...",
    searchNameEmail: "Cari nama atau email...",
    learnersHeading: "Peserta",
    colModule: "Modul",
    colTask: "Tugas",
    colTasksDone: "Tugas dikerjakan",
    colEmail: "Email",
    colActions: "Aksi",
    colQuiz: "Kuis",
    completedOfEnrollments: "{selesai} selesai dari {total} pendaftaran",
  },
  landing: {
    signIn: "Masuk",
    getStarted: "Mulai",
    exploreCourses: "Jelajahi Kursus",
    footerTagline:
      "Kembangkan diri Anda melalui pengetahuan bersama Sanggabiz. Akses kursus berkualitas yang dirancang untuk membantu Anda mencapai tujuan.",
    privacy: "Privasi",
  },
  display: {
    title: "Tampilan",
    openPanel: "Atur tampilan",
    intro:
      "Pengaturan ini mengubah tampilan halaman di perangkat ini saja. Bawaannya mengikuti pengaturan perangkat Anda.",
    textSize: "Ukuran teks",
    textSizeDevice: "Ikut perangkat",
    textSizeLarge: "Besar",
    textSizeLarger: "Lebih besar",
    contrast: "Kontras",
    contrastDevice: "Ikut perangkat",
    contrastHigh: "Tinggi",
    motion: "Animasi",
    motionDevice: "Ikut perangkat",
    motionReduced: "Dikurangi",
    deviceHint: "Tersimpan di perangkat ini, tidak dikirim ke mana pun.",
    browserZoomHint:
      "Anda juga bisa memperbesar seluruh halaman dengan Ctrl + dan Ctrl - di peramban; keduanya bisa dipakai bersamaan.",
  },
  profile: {
    edit: "Ubah profil",
    editTitle: "Ubah Profil",
    backToProfile: "Kembali ke profil",
    enrolledCourses: "Kursus Terdaftar",
    certificates: "Sertifikat",
    noCertificates:
      "Belum ada sertifikat. Sertifikat terbit otomatis setelah Anda menyelesaikan kursus yang menyediakannya.",
    certificateBeingMade: "Sedang dibuat…",
    download: "Unduh",
    uploadPhoto: "Unggah foto",
    changePhoto: "Ganti foto",
    removePhoto: "Hapus",
    uploading: "Mengunggah…",
    photoReady: "Foto siap. Tekan Simpan Perubahan untuk menyimpannya.",
    photoRemoved: "Foto dihapus. Tekan Simpan Perubahan untuk menyimpannya.",
    photoHint: "PNG, JPG, atau WebP. Maksimal 2MB.",
    name: "Nama",
    nameHint: "Nama yang menyapa Anda di seluruh halaman.",
    certificateName: "Nama di sertifikat",
    certificateNameHint:
      "Nama ini yang akan dicetak di sertifikat. Samakan dengan identitas resmi Anda bila sertifikatnya akan dipakai untuk keperluan formal. Dikosongkan berarti memakai nama di atas. Sertifikat yang sudah terbit tidak ikut berubah.",
    organization: "Nama usaha atau instansi",
    organizationHint: "Membantu pengelola mengenali Anda datang dari usaha mana.",
    phone: "Nomor telepon",
    phoneHint:
      "Dipakai pengelola bila ada perubahan jadwal atau kendala akses. Tidak pernah ditampilkan ke peserta lain.",
    emailLocked: "Email tidak dapat diubah",
    saved: "Profil tersimpan.",
    saveChanges: "Simpan Perubahan",
    joinedSince: "Bergabung sejak",
  },
  player: {
    previousLesson: "Pelajaran sebelumnya",
    nextLesson: "Pelajaran berikutnya",
    previous: "Sebelumnya",
    finishLesson: "Selesaikan pelajaran",
    finishCourse: "Selesaikan kursus",
    lessonNavigation: "Navigasi pelajaran",
    readFullscreen: "Baca dalam layar penuh",
    exitFullscreen: "Keluar dari layar penuh",
    quizComingSoon: "Kuis segera hadir.",
    lastLessonDone: "Anda telah menyelesaikan pelajaran terakhir di kursus ini.",
    certificateReady: "Sertifikat Anda siap diunduh.",
    viewCertificate: "Lihat Sertifikat Anda",
    findAnotherCourse: "Cari kursus lain",
    almostDone: "Pelajarannya sudah selesai semua. Satu langkah lagi.",
    almostDoneHint:
      "Kursus ini dinyatakan selesai setelah setiap kuisnya lulus. Sertifikat dan ulasan terbuka setelah itu.",
    bestScore: "Nilai terbaik Anda",
    notAttempted: "Belum dikerjakan.",
    passMark: "Nilai minimal untuk lulus",
    attemptsUsed: "Percobaan terpakai",
    attemptsUnlimited: "percobaan, tanpa batas percobaan.",
    tryAgain: "Kerjakan lagi",
    finalGrade: "Nilai akhir kursus Anda",
    congratulations: "Selamat, Anda telah menyelesaikan",
    reviewInvite:
      "Punya waktu sebentar? Ulasan Anda membantu peserta berikutnya memilih kursus. Ini opsional.",
    myNotes: "Catatan saya",
    notesHint:
      "Hanya Anda yang dapat melihat catatan ini. Catatan tersimpan otomatis saat Anda berhenti mengetik.",
    notesPlaceholder: "Catatan untuk pelajaran ini",
    firstLesson: "Pelajaran sebelumnya (ini pelajaran pertama)",
  },
  pageTitles: {
    lesson: "Pelajaran",
    newPassword: "Kata sandi baru",
    forgotPassword: "Lupa kata sandi",
    admin: "Pengelola",
    coursePreview: "Pratinjau kursus",
    myLearning: "Belajar saya",
  },
  shell: {
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    openSidebar: "Buka sidebar",
    closeSidebar: "Tutup sidebar",
    mainNavigation: "Navigasi utama",
    signOutFailed: "Gagal keluar. Periksa koneksi Anda, lalu coba lagi.",
    signingOut: "Keluar…",
  },
}

const en: Dictionary = {
  common: {
    skipToContent: "Skip to main content",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving…",
    language: "Language",
    changeLanguage: "Change language",
    optional: "optional",
  },
  nav: {
    dashboard: "Dashboard",
    courses: "Courses",
    purchases: "Purchases",
    notifications: "Notifications",
    profile: "Profile",
    settings: "Settings",
    signOut: "Sign out",
  },
  auth: {
    signInTitle: "Sign in",
    signInSubtitle: "Sign in to Sanggabiz to continue.",
    email: "Email",
    password: "Password",
    showPassword: "Show password",
    forgotPassword: "Forgot your password?",
    signIn: "Sign in",
    signingIn: "Signing in…",
    orContinueWith: "Or continue with",
    continueWithGoogle: "Continue with Google",
    noAccount: "Don't have an account?",
    register: "Sign up",
    emailPlaceholder: "name@example.com",
    redirecting: "Redirecting…",
  },
  settings: {
    title: "Settings",
    notifications: "Notifications",
    emailNotifications: "Email notifications",
    emailNotificationsHint:
      "Your choice is saved, but email delivery is not active yet. For now, notices appear only on the Notifications page.",
    emailOn: "Email notifications turned on",
    emailOff: "Email notifications turned off",
    security: "Security",
    changePassword: "Change password",
    newPasswordPlaceholder: "Enter a new password",
    passwordSaved: "Password saved",
    deleteAccount: "Delete account",
    deleteAccountHint: "Permanently delete your account",
    deleteAccountWarning: "A deleted account cannot be restored",
    deletingAccount: "Deleting account…",
  },
  signup: {
    title: "Create your account",
    subtitle: "Start learning with Sanggabiz.",
    fullName: "Full name",
    fullNameHelp: "This is the name printed on your certificate.",
    emailHelp: "Used to sign in and to receive course notices.",
    passwordHelp: "At least 8 characters.",
    submit: "Sign up",
    submitting: "Creating account…",
    checkEmail: "Check your email",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    redirecting: "Redirecting…",
  },
  forgot: {
    title: "Forgot your password",
    subtitle: "Enter your account email. We will send you a link to create a new password.",
    submit: "Send link",
    submitting: "Sending…",
    checkEmail: "Check your email",
    sentTo: "If {email} is registered, we have sent a link to create a new password.",
    sentHint: "The link is valid for a limited time.",
    checkSpam: "Not in your inbox? Check the spam folder.",
    backToSignIn: "Back to sign in",
    rememberPassword: "Remember your password?",
  },
  newPassword: {
    title: "Create a new password",
    newPassword: "New password",
    repeatPassword: "Repeat new password",
    mismatch: "The two passwords do not match yet.",
  },
  dashboard: {
    greeting: "Hello",
    coursesInProgress: "Courses in progress",
    coursesCompleted: "Courses completed",
    ofEnrolled: "of {n} enrolled",
    keepGoing: "Keep going",
    lessonsCompleted: "Lessons done",
    certificates: "Certificates",
    readyToDownload: "ready to download",
    continueLearning: "Continue learning",
    nextLesson: "Next: lesson",
    lessonsDone: "done",
    continueAt: "Continue: lesson",
    noneInProgress: "You are not taking any course yet.",
    recommended: "Recommended courses",
    noRecommendations: "No recommendations yet",
    start: "Start",
    continue: "Continue",
    learners: "Learners",
    of: "of",
    lessonsProgress: "lessons done",
  },
  courses: {
    searchPlaceholder: "Search courses...",
    searchLabel: "Search courses",
    sort: "Sort",
    newest: "Newest",
    title: "Title",
    priceLowest: "Price: lowest",
    all: "All courses",
    enrolled: "Enrolled",
    completed: "Completed",
    noneEnrolled: "You are not enrolled in any course yet.",
    noneCompleted: "You have not completed any course yet.",
    noMatches: "No course matches your search.",
    preview: "Preview",
    lessons: "lessons",
    hours: "hours",
  },
  purchases: {
    title: "Purchase history",
    subtitle: "Your course purchases and enrolments",
    totalSpent: "Total spent",
    purchases: "Purchases",
    paid: "Paid",
    allPurchases: "All purchases",
    course: "Course",
    amount: "Amount",
    status: "Status",
    date: "Date",
    none: "No purchases yet.",
    noMatches: "No purchase matches your search.",
    searchLabel: "Search by course",
    filterLabel: "Filter by status",
    statusPaid: "Paid",
    statusFree: "Free",
    statusPending: "Pending",
    statusRefunded: "Refunded",
    allStatuses: "All statuses",
  },
  notifications: {
    all: "All notifications",
    title: "Notifications",
    subtitle: "All your notifications, newest first",
    empty: "No notices yet",
    emptyHint: "News about your courses, marks, and certificates appears here.",
  },
  pagination: {
    showing: "Showing {from}–{to} of {total}",
    loading: "Loading…",
  },
  enroll: {
    join: "Enrol in course",
    continueLearning: "Continue learning",
    startLearning: "Start learning",
    enrolledStartLearning: "Enrolled ✓ Start learning",
  },
  nearGoal: {
    start: "Start small: {modul} \u2014 {n} lessons, about {menit} minutes",
    startNoTime: "Start small: {modul} \u2014 {n} lessons",
    resume: "Nearest goal: {modul} \u2014 {selesai} of {n} lessons done",
  },
  kpi: {
    title: "What exactly is counted",
    noTarget:
      "No targets set yet. A number without a target can only be looked at, not judged \u2014 setting one is the owner's decision.",
    defLearners:
      "Distinct people enrolled in at least one course within your scope (superadmin: the whole platform). One person on three courses counts once.",
    defCourses: "Courses within your scope, draft and published alike. The small note says how many are published.",
    defCompletionRate:
      "Completed enrolments divided by all enrolments, counted per enrolment rather than per person \u2014 one person finishing two courses contributes two.",
    defCompleted: "Enrolments that reached completed status: every lesson done and every quiz passed.",
    defEnrollments: "Enrolment rows on courses within your scope. One person on two courses counts twice.",
    defTrackedEnrollments: "Every enrolment on courses within your scope, whatever its status.",
    defAvgModulePct:
      "The percentage of lessons completed, computed per enrolment and then averaged. Enrolments that never started count as 0%.",
  },
  adaptive: {
    suggestTitle: "A suggestion before you retry",
    struggled: "The question \u201C{soal}\u201D has now been answered wrongly {n} times.",
    reason: "So we suggest reopening the material first:",
    freedom: "Just a suggestion \u2014 you can retry right away.",
  },
  tracking: {
    cardTitle: "Help Us Improve the Material",
    cardHint: "Optional. Declining takes nothing away from what you can use.",
    collected: "What is recorded",
    purpose: "What it is for",
    notDone: "What is never done",
    storedLabel: "Kept for:",
    whoSeesLabel: "Who can see it:",
    allow: "Allow this recording",
    stateOn:
      "Being recorded. Turning this off stops the recording and deletes what has been collected.",
    stateUndecided: "Nothing is being recorded.",
    stateOff: "Not recorded, and earlier data has been deleted.",
    nudgeTitle: "Help improve the material?",
    nudgeBody:
      "You can allow recording of which lessons you open and for how long, to improve the material. Entirely your choice — declining takes nothing away.",
    nudgeAction: "Read and decide",
    nudgeDismiss: "Not now",
    collectedItems: [
      "Which lessons you open, and how long the page stays open.",
      "Which course you are working on, and when.",
    ],
    purposeItems: [
      "Finding which part of the material people most often abandon, so it can be improved.",
      "Comparing one cohort with the next.",
    ],
    notDoneItems: [
      "Never used to assess you, and never affects your marks or completion.",
      "Never used to make automated decisions about you.",
      "Never shared outside Sanggabiz Academy.",
    ],
    storage: "Kept for at most 12 months, then deleted automatically.",
    whoSees: "Only Sanggabiz Academy superadmins, and you.",
    withdrawal:
      "You may decline now and still use every feature of the LMS without exception. If you have agreed, you can withdraw at any time — recording stops immediately, and you can delete what has already been collected.",
  },
  grading: {
    backToGrading: "Back to Grading",
    attemptsPendingReview: "Attempts Pending Review",
    matrixSubtitle:
      "All quiz grades for this course. Auto-graded cells are read-only; essay cells need grading.",
    searchCourses: "Search courses...",
    searchLearners: "Search learners...",
    colAttempts: "Attempts",
    open: "Open",
    noCourseMatches: "No course matches your search.",
    courseGradeCol: "Course Grade",
    noQuizzes: "This course has no quizzes yet.",
    savingGrades: "Saving grades\u2026",
    pointsRange: "Points must be between 0 and {maks}",
    attemptsGraded: "{n} attempts graded",
    saveFailedAll: "Could not save grades. Check the details above the table, then try again.",
    saveFailedSome:
      "{gagal} of {total} attempts could not be graded. Check the details above the table, then try again.",
    succeededSummary: "{n} attempts graded successfully.",
    failedSummary: "{n} attempts failed:",
    noSubmission: "No submission",
    pendingShort: "pending",
    pendingCount: "{n} pending",
    provisionalTitle: "Provisional: auto-graded questions only",
    gradeAria: "Grade for {nama} on {kuis} (0-100)",
    pointsAria: "Points for question {i}, {nama} (max {maks})",
    previewSubmission: "Preview submission",
    taskInfo: "Assignment info",
    passScore: "Passing score: {n}%",
    weightInGrade: "Weight {n}\u00D7 in the course grade",
    untitledQuestion: "Untitled question",
    moreCount: "+{n} more",
    exportCsv: "Export Course CSV",
    exporting: "Exporting\u2026",
    csvDownloaded: "CSV downloaded",
    exportFailedReload: "Could not export the CSV. Reload the page, then try again.",
    exportFailedNetwork: "Could not export the CSV. Check your connection, then try again.",
    importGrades: "Import Grades",
    importTitle: "Import Grades from CSV",
    importDescription:
      "Upload the CSV exported from this Grading page (with essay grades filled in) to apply grades in one go.",
    pickCsv: "Choose a CSV file",
    dropHere: "Drag & drop a CSV here, or",
    clickToChoose: "click to choose a file",
    importing: "Importing\u2026",
    importingDontClose: "Importing\u2026 Do not close this window until the import finishes.",
    rowsFailed: "{n} rows failed:",
    done: "Done",
    close: "Close",
    openSubmittedLink: "Open the submitted link",
  },
  insight: {
    back: "Back",
    dropoffTitle: "Where learners stop",
    dropoffSubtitle:
      "Computed from the lesson completions already recorded to run the course. Of {total} enrolled learners, {belum} have not completed a single lesson.",
    mostStopPrefix: "Most stop at",
    mostStopSuffix: "\u2014 {n} learners stopped exactly here.",
    scrollFunnel: "Lesson completion funnel, scrolls horizontally",
    colLesson: "Lesson",
    colDone: "Completed",
    colStalled: "Stopped here",
    dropoffNotReadyPrefix: "Drop-off analysis is not active yet: the function",
    behaviorNotReadyPrefix: "Behaviour tracking is not active yet: the function",
    notReadyMiddle: "does not exist in the database. Run",
    notReadyEnd: "in the Supabase SQL Editor.",
    strugglesTitle: "Where learners struggle",
    strugglesSubtitle:
      "Computed from the answers submitted so far, aggregated across learners. Questions never answered are not shown.",
    scrollHardest: "Hardest questions, scrolls horizontally",
    colQuestion: "Question",
    colCorrect: "Correct",
    ofAnswers: "{benar} of {total} answers",
    effortTitle: "How demanding the quizzes are",
    effortSubtitle:
      "Attempts are unlimited, so these numbers show how many tries learners needed to understand \u2014 not how many they were allowed.",
    scrollEffort: "Quiz effort, scrolls horizontally",
    colPassed: "Passed",
    colAttemptsToPass: "Attempts to pass",
    colFirstScore: "First-attempt score",
    colBestScore: "Best score",
    passedOf: "{lulus} of {total}",
    attemptsTotal: "{n} attempts in total",
    nonePassed: "no one has passed yet",
    average: "average",
    behaviorTitle: "Study time",
    consentPrefix: "Recorded only for learners who agreed to it:",
    ofLearners: "of {total} learners",
    declinedSuffix: "({n} declined)",
    undecidedSuffix: ", {n} undecided",
    consentTail: "The numbers below therefore describe that group only, not every learner.",
    noConsentYet: "No learner has agreed to tracking yet, so there is nothing to show.",
    noTimeYet: "No study time has been recorded yet.",
    scrollStudyTime: "Study time per course, scrolls horizontally",
    colLearnersHead: "Learners",
    colTotal: "Total",
    colAverage: "Average",
    seconds: "{n} seconds",
    minutes: "{n} minutes",
    hoursMinutes: "{j} h {m} min",
    moduleCompletion: "Module Completion",
    tasksDoneLabel: "Tasks attempted",
    submittedNote: "quizzes submitted, passed or not",
    moduleHead: "Modules",
    noLessons: "This course has no lessons yet.",
    quizzesHead: "Quizzes",
    noQuizzesHere: "This course has no quizzes.",
    colScore: "Score",
    colSubmitted: "Submitted",
    badgeNotStarted: "Not started",
    badgeInProgress: "In progress",
    badgePendingReview: "Awaiting grading",
    badgePassed: "Passed",
    badgeNotPassed: "Not passed",
    difficultyTitle: "Difficulty spots",
    difficultyEmpty:
      "No question has been answered incorrectly yet. Difficulty spots appear here once the learner takes quizzes.",
    nUnmastered: "{n} questions",
    unmasteredRest: "are still not mastered. Each row links to the lesson that teaches it.",
    allMastered: "Every question once answered wrong was eventually answered correctly.",
    wrongOf: "Wrong {salah} of {total} times",
    finallyCorrect: "eventually answered correctly",
    openLesson: "Open lesson: {judul}",
  },
  editor: {
    destructiveTitle: "This save deletes content",
    destructivePrefix: "Saving will permanently delete",
    nLessons: "{n} lessons",
    nQuestions: "{n} questions",
    andWord: "and",
    destructiveSuffix:
      ", including any related learner progress or quiz attempts. This cannot be undone.",
    keepSaving: "Save anyway",
    newCourse: "New Course",
    editCourse: "Edit Course",
    publishedToast: "Course published",
    invalidData: "Course data is not valid",
    noLessonsPublish: "The course has no lessons yet. Add at least one before publishing.",
    plusOthers: "(+{n} more)",
    plusOtherLessons: "(+{n} other lessons)",
    leaveTitle: "Unsaved changes",
    leaveDesc: "There are unsaved changes. Leave without saving?",
    leave: "Leave",
    savingBlockMessage: "A save is in progress. Leave the page without waiting for the result?",
    saveDraft: "Save Draft",
    publish: "Publish",
    unsavedChanges: "Unsaved changes",
    tabBasic: "Basic Info",
    tabLessons: "Lessons",
    tabSettings: "Settings",
    tabLearners: "Learners",
    tabPreview: "Preview",
    loadingSettings: "Loading settings\u2026",
    loadingLearners: "Loading learners\u2026",
    statusSavedAt: "Saved at {waktu}",
    statusSaved: "Saved",
    statusUnsaved: "Not saved yet",
    statusError: "Save failed",
    restoreTitle: "Unsaved changes found",
    restoreDesc:
      "There are changes from {waktu} that were never saved. Restore them, or discard them and use the saved version?",
    restoreStale:
      "This course has also changed on the server since then. If restored, the server changes will be overwritten when you save.",
    discard: "Discard",
    restore: "Restore",
    justNow: "just now",
    minutesAgo: "{n} minutes ago",
    hoursAgo: "{n} hours ago",
    daysAgo: "{n} days ago",
    labelTitle: "Course Title",
    phTitle: "e.g. Introduction to Web Development",
    labelDescription: "Course Description",
    phDescription: "What will learners get from this course?",
    labelRequirements: "Requirements",
    phRequirements: "One requirement per line",
    labelAudience: "Who this course is for",
    phAudience: "One target learner per line",
    labelThumb: "Course Image",
    hintThumb: "PNG or JPEG, max 5MB",
    basicSettings: "Basic Settings",
    level: "Level",
    pickLevel: "Choose a level",
    levelBeginner: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",
    enrollmentSettings: "Enrollment Settings",
    privateCourse: "Private course",
    privateDesc:
      "Only learners you enroll can find or open this course. It does not appear in the public catalogue. Add learners from the Learners tab.",
    draftWarnTitle: "This course is still a draft.",
    draftWarnRest:
      "Invited learners cannot open it until you press Publish. The private setting only controls who can find it, not whether it is live.",
    privateNote:
      "Learners cannot enroll themselves in a private course, so the pricing options below only apply if the course is later made public.",
    publicDesc: "Anyone can enroll at no cost.",
    paidDesc: "Learners pay a fixed price to enroll.",
    priceLabel: "Price",
    pricePh: "Rp 150.000",
    instructorSettings: "Instructor Settings",
    seqTitle: "Learning Order",
    seqLabel: "Must be sequential",
    seqDesc:
      "The next lesson only unlocks once the previous one is finished. Off means learners can pick any lesson, like most online courses.",
    seqNotePrefix: "A quiz lesson only counts as finished once the learner",
    seqNoteStrong: "passes",
    seqNoteSuffix:
      ", not merely ticks it. Learners already partway through this course will also be locked at lessons they have not finished.",
    prereqTitle: "Prerequisite Settings",
    requirePrereq: "Require Prerequisites",
    requirePrereqDesc: "Learners must complete another course before enrolling in this one",
    prereqCourses: "Prerequisite Courses",
    pickCourse: "Choose a course",
    add: "Add",
    prereqHelp: "Choose the courses a learner must complete before they can enroll in this course",
    removePrereq: "Remove prerequisite {judul}",
    uploading: "Uploading\u2026",
    clickToUpload: "Click to upload an image",
    removeImage: "Remove {label}",
    certTitle: "Certificate Settings",
    enableCert: "Enable Certificate",
    enableCertDesc: "Issue a certificate to learners who complete the course",
    passingGradeLabel: "Passing Grade (%)",
    passingGradeDesc:
      "The minimum weighted course grade a learner must reach, besides passing every quiz, before the course counts as completed and the certificate is issued.",
    certTemplate: "Certificate Template (Optional)",
    certTemplateHint: "Landscape orientation, PNG/JPEG, max 5MB",
    layoutHead: "Layout",
    inheritMain: "Follow Main Settings",
    certTypeHead: "Certificate Type",
    customTitleLabel: "Custom Certificate Title",
    customTitlePh: "e.g. Certificate of Expertise",
    certDescLabel: "Certificate Description",
    charCount: "{n}/150 characters",
    certDescPh: "e.g. This certifies that [Nama Peserta] has completed [Nama Kursus].",
    tokensSupported: "Supported tokens: [Nama Peserta], [Nama Kursus]",
    signatureLabel: "Upload Signature Image",
    signatureHint: "PNG or JPEG, max 1MB",
    signatureInheritHas: "Leaving this empty uses the signature from the main settings.",
    signatureInheritNone: "The main settings have no signature image either.",
    signerNameLabel: "Signer Name",
    signerNamePh: "e.g. Budi Santoso",
    signerTitleLabel: "Signer Title",
    signerTitlePh: "e.g. Course Instructor, Director of Education",
    additionalTextLabel: "Additional Text (Optional)",
    additionalTextPh: "Additional text shown on the certificate...",
    inheritedHintPrefix: "Following main settings",
    inheritedEmpty: "(not yet filled by the superadmin)",
    certTypeCompletion: "Completion",
    certTypeCompletionDesc: "\"Certificate of Completion\" - \"has successfully completed\"",
    certTypeParticipation: "Participation",
    certTypeParticipationDesc: "\"Certificate of Participation\" - \"has participated in\"",
    certTypeAchievement: "Achievement",
    certTypeAchievementDesc: "\"Certificate of Achievement\" - \"has successfully achieved\"",
    certTypeCustom: "Custom Title (Optional)",
    certTypeCustomDesc: "Enter your own certificate title",
    certLayoutKlasik: "Classic",
    certLayoutKlasikDesc: "Double frame, everything centred",
    certLayoutModern: "Modern",
    certLayoutModernDesc: "Colour band on the left edge, left-aligned text",
    certLayoutFormal: "Formal",
    certLayoutFormalDesc: "Thin rules, signer centred at the bottom",
    noInstructors: "No instructors yet. Create one to get started.",
    selectedMark: "Selected \u2713",
    deleteNamed: "Delete {nama}",
    deleteInstructorTitle: "Delete \u201C{nama}\u201D?",
    deleteInstructorDesc:
      "This instructor will be detached from every course they are assigned to. This cannot be undone.",
    deleting: "Deleting\u2026",
    deleteWord: "Delete",
    addInstructor: "Add Instructor",
    nameLabel: "Name",
    bioLabel: "Bio",
    creating: "Creating\u2026",
    create: "Create",
    instructorCreated: "Instructor created and assigned",
    instructorDeleted: "Instructor deleted",
    enrolledLearnersCount: "Enrolled Learners ({n})",
    enrolledLearners: "Enrolled Learners",
    privateRosterNote: "This course is private, so learners can only get in if enrolled here.",
    publicRosterNote: "This course is public, so learners can also enroll themselves.",
    inviteLearner: "Invite learner",
    removingLearner: "Removing learner\u2026",
    searchEnrolled: "Search enrolled learners...",
    noEnrolledYet: "No learners enrolled yet",
    noRosterMatches: "No learner matches your search",
    inviteHintPrefix: "Use",
    inviteHintSuffix:
      "to find learners already registered on the platform and enroll them in this course.",
    statusDone: "Completed",
    statusActive: "Active",
    unenrollNamed: "Remove {nama}",
    unenrollTitle: "Remove {nama}?",
    unenrollDesc:
      "This learner's enrollment and their progress in this course will be deleted. This cannot be undone.",
    unenrolling: "Removing\u2026",
    unenroll: "Remove",
    unenrolledToast: "{nama} removed",
    enrollingBusy: "Enrolling\u2026",
    inviteDesc: "Search learners by name or email, then enroll them in this course.",
    searchByNameEmail: "Search learners by name or email",
    searchPh: "Name or email\u2026",
    typeMinChars: "Type at least {n} characters to search.",
    searching: "Searching\u2026",
    allMatchedEnrolled: "Every matching learner is already enrolled.",
    learnerNotFound: "No learner found.",
    enrolling: "Enrolling\u2026",
    enrollVerb: "Enroll",
    enrolledToast: "{nama} enrolled",
    done: "Done",
    reviewsCount: "{n} reviews",
    searchFeedback: "Search learner name or email...",
    noReviews: "No reviews yet",
    noReviewMatches: "No review matches your search",
    reviewsHint: "Learners are asked to rate the course after completing it.",
    untitledCourse: "Untitled course",
    noDescription: "No description yet.",
  },
  admin: {
    dashboard: "Dashboard",
    courses: "Courses",
    grading: "Grading",
    tracking: "Tracking",
    learners: "Learners",
    purchases: "Purchases",
    mentors: "Mentors",
    landing: "Home page",
    certificates: "Certificates",
    settings: "Settings",
    profile: "Profile",
    dashboardSubtitlePlatform:
      "Across the whole platform: learners, courses, and recent activity",
    dashboardSubtitleMentor:
      "Across the courses you manage, their learners, and recent activity",
    totalLearners: "Total learners",
    totalCourses: "Total courses",
    completionRate: "Completion rate",
    coursesCompleted: "Courses completed",
    myCourses: "My courses",
    myLearners: "Learners in my courses",
    myCompleted: "Completed in my courses",
    published: "Published",
    coursesSubtitle: "Create, edit, and manage every course on your learning platform",
    createCourse: "Create Course",
    learnersSubtitle: "View and manage every learner enrolled in a course",
    gradingSubtitle:
      "Every course with quiz submissions. Automatic marks are read-only; essays need marking.",
    gradingCoursesTitle: "Courses with Submissions",
    gradingEmpty: "No quiz submissions yet.",
    trackingSubtitle: "Follow each learner's module and task completion, course by course",
    trackingEmpty: "No enrolments yet.",
    recentCourses: "Recent Courses",
    recentEnrollments: "Recent Enrolments",
    noEnrollments: "No learners have enrolled yet",
    noEnrollmentsHint:
      "Enrolments appear here once your course is published. You can also enrol learners yourself.",
    noCourses: "No courses yet",
    noCoursesHint: "Courses you create appear here, including ones still in draft.",
    noNotifications: "No notices yet",
    noNotificationsHint: "News about your courses and certificates appears here.",
    totalLearnersLabel: "Total Learners",
    coursesCompletedLabel: "Courses Completed",
    allLearners: "All Learners",
    viewAll: "View All",
    totalEnrollmentsLabel: "Total Enrolments",
    colTitle: "Title",
    colStatus: "Status",
    colDate: "Date",
    colLearner: "Learner",
    colCourse: "Course",
    noLearnerMatches: "No learner matches your search.",
    filterAllStatuses: "All statuses",
    filterDraft: "Draft",
    filterAllPrices: "All prices",
    filterPublic: "Public",
    filterPaid: "Paid",
    filterEnrolled: "Enrolled",
    filterCompleted: "Completed",
    searchCourseTitle: "Search course title...",
    searchNameEmail: "Search name or email...",
    learnersHeading: "Learners",
    colModule: "Module",
    colTask: "Task",
    colTasksDone: "Tasks done",
    colEmail: "Email",
    colActions: "Actions",
    colQuiz: "Quiz",
    completedOfEnrollments: "{selesai} completed of {total} enrolments",
  },
  landing: {
    signIn: "Sign in",
    getStarted: "Get started",
    exploreCourses: "Browse courses",
    footerTagline:
      "Grow through knowledge with Sanggabiz. Quality courses designed to help you reach your goals.",
    privacy: "Privacy",
  },
  display: {
    title: "Display",
    openPanel: "Display settings",
    intro:
      "These settings change how pages look on this device only. By default they follow your device settings.",
    textSize: "Text size",
    textSizeDevice: "Follow device",
    textSizeLarge: "Large",
    textSizeLarger: "Larger",
    contrast: "Contrast",
    contrastDevice: "Follow device",
    contrastHigh: "High",
    motion: "Motion",
    motionDevice: "Follow device",
    motionReduced: "Reduced",
    deviceHint: "Saved on this device; never sent anywhere.",
    browserZoomHint:
      "You can also zoom the whole page with Ctrl + and Ctrl - in your browser; both work together.",
  },
  profile: {
    edit: "Edit profile",
    editTitle: "Edit profile",
    backToProfile: "Back to profile",
    enrolledCourses: "Enrolled courses",
    certificates: "Certificates",
    noCertificates:
      "No certificates yet. A certificate is issued automatically once you finish a course that offers one.",
    certificateBeingMade: "Being prepared…",
    download: "Download",
    uploadPhoto: "Upload photo",
    changePhoto: "Change photo",
    removePhoto: "Remove",
    uploading: "Uploading…",
    photoReady: "Photo ready. Press Save changes to keep it.",
    photoRemoved: "Photo removed. Press Save changes to keep it.",
    photoHint: "PNG, JPG, or WebP. 2MB maximum.",
    name: "Name",
    nameHint: "The name used to greet you across the site.",
    certificateName: "Name on certificate",
    certificateNameHint:
      "This is the name printed on your certificate. Match it to your official identity document if the certificate will be used formally. Left empty, your name above is used. Certificates already issued do not change.",
    organization: "Business or organisation",
    organizationHint: "Helps the organisers know which business you come from.",
    phone: "Phone number",
    phoneHint:
      "Used by the organisers if the schedule changes or you have trouble getting in. Never shown to other learners.",
    emailLocked: "Email cannot be changed",
    saved: "Profile saved.",
    saveChanges: "Save changes",
    joinedSince: "Member since",
  },
  player: {
    previousLesson: "Previous lesson",
    nextLesson: "Next lesson",
    previous: "Previous",
    finishLesson: "Finish lesson",
    finishCourse: "Finish course",
    lessonNavigation: "Lesson navigation",
    readFullscreen: "Read full screen",
    exitFullscreen: "Exit full screen",
    quizComingSoon: "Quiz coming soon.",
    lastLessonDone: "You have finished the last lesson in this course.",
    certificateReady: "Your certificate is ready to download.",
    viewCertificate: "View your certificate",
    findAnotherCourse: "Find another course",
    almostDone: "All lessons done. One step to go.",
    almostDoneHint:
      "This course counts as finished once every quiz is passed. The certificate and the review open after that.",
    bestScore: "Your best score",
    notAttempted: "Not attempted yet.",
    passMark: "Pass mark",
    attemptsUsed: "Attempts used",
    attemptsUnlimited: "attempts, no limit.",
    tryAgain: "Try again",
    finalGrade: "Your final course grade",
    congratulations: "Congratulations, you have completed",
    reviewInvite:
      "Have a moment? Your review helps the next learner choose. It is optional.",
    myNotes: "My notes",
    notesHint:
      "Only you can see these notes. They save automatically when you stop typing.",
    notesPlaceholder: "Notes for this lesson",
    firstLesson: "Previous lesson (this is the first lesson)",
  },
  pageTitles: {
    lesson: "Lesson",
    newPassword: "New password",
    forgotPassword: "Forgot password",
    admin: "Manage",
    coursePreview: "Course preview",
    myLearning: "My learning",
  },
  shell: {
    openMenu: "Open menu",
    closeMenu: "Close menu",
    openSidebar: "Open sidebar",
    closeSidebar: "Close sidebar",
    mainNavigation: "Main navigation",
    signOutFailed: "Could not sign out. Check your connection, then try again.",
    signingOut: "Signing out…",
  },
}

export const DICTIONARIES: Record<Locale, Dictionary> = { id, en }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

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
    confirmPassword: string
    submit: string
    submitting: string
    checkEmail: string
    haveAccount: string
    signIn: string
    redirecting: string
  }
  forgot: {
    title: string
    submit: string
    submitting: string
    checkEmail: string
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
  }
  pagination: {
    /** `{from}`, `{to}`, `{total}` diganti angka saat dipakai. */
    showing: string
    loading: string
  }
  enroll: {
    join: string
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
    collectedItems: string[]
    purposeItems: string[]
    notDoneItems: string[]
    storage: string
    whoSees: string
    withdrawal: string
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
    courseThumbAlt: string
    totalLearnersLabel: string
    coursesCompletedLabel: string
    allLearners: string
    viewAll: string
    totalEnrollmentsLabel: string
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
    confirmPassword: "Konfirmasi kata sandi",
    submit: "Daftar",
    submitting: "Mendaftarkan…",
    checkEmail: "Periksa email Anda",
    haveAccount: "Sudah punya akun?",
    signIn: "Masuk",
    redirecting: "Mengalihkan…",
  },
  forgot: {
    title: "Lupa kata sandi",
    submit: "Kirim tautan",
    submitting: "Mengirim…",
    checkEmail: "Periksa email Anda",
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
  },
  pagination: {
    showing: "Menampilkan {from}–{to} dari {total}",
    loading: "Memuat…",
  },
  enroll: {
    join: "Ikuti kursus",
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
    noEnrollments: "Belum ada pendaftaran",
    courseThumbAlt: "gambar kursus",
    totalLearnersLabel: "Total Peserta",
    coursesCompletedLabel: "Kursus Selesai",
    allLearners: "Semua Peserta",
    viewAll: "Lihat Semua",
    totalEnrollmentsLabel: "Total Pendaftaran",
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
    confirmPassword: "Confirm password",
    submit: "Sign up",
    submitting: "Creating account…",
    checkEmail: "Check your email",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    redirecting: "Redirecting…",
  },
  forgot: {
    title: "Forgot your password",
    submit: "Send link",
    submitting: "Sending…",
    checkEmail: "Check your email",
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
  },
  pagination: {
    showing: "Showing {from}–{to} of {total}",
    loading: "Loading…",
  },
  enroll: {
    join: "Enrol in course",
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
    noEnrollments: "No enrolments yet",
    courseThumbAlt: "course image",
    totalLearnersLabel: "Total Learners",
    coursesCompletedLabel: "Courses Completed",
    allLearners: "All Learners",
    viewAll: "View All",
    totalEnrollmentsLabel: "Total Enrolments",
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

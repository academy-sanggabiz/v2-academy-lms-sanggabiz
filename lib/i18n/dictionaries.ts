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

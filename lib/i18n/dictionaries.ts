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
    languageTitle: string
    languageHint: string
    languageSaved: string
    deletingBlockMessage: string
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
    forYourJob: string
    jobRequired: string
    jobSuggested: string
    jobReasonRequired: string
    jobReasonSuggested: string
    jobDueIn: string
    jobOverdue: string
    jobStart: string
    jobContinue: string
    jobEnrollNow: string
    jobNoneYet: string
    noRecommendations: string
    start: string
    continue: string
    learners: string
    of: string
    lessonsProgress: string
  }
  courses: {
    accessPrivate: string
    accessPublic: string
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
    category: string
    pickCategory: string
    noCategory: string
    newCategory: string
    newCategoryLabel: string
    newCategoryPh: string
    categoryCreated: string
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
    lessonTypeVideo: string
    lessonTypeVideoDesc: string
    lessonTypeText: string
    lessonTypeTextDesc: string
    lessonTypePpt: string
    lessonTypePptDesc: string
    lessonTypeQuiz: string
    lessonTypeQuizDesc: string
    courseLessons: string
    addModule: string
    noModules: string
    unnamedModule: string
    untitledLesson: string
    /** `{n}` nomor urut. */
    lessonN: string
    /** `{judul}` nama modul. */
    moveModuleAria: string
    /** `{judul}` judul pelajaran. */
    moveLessonAria: string
    clickToRename: string
    deleteModuleAttr: string
    /** `{judul}` yang dihapus. */
    deleteTitled: string
    /** `{n}` jumlah pelajaran di modul. */
    deleteSectionDesc: string
    toggleOpen: string
    noLessonsInModule: string
    addLesson: string
    complete: string
    incomplete: string
    /** `{n}` jumlah masalah. */
    nQuizIssues: string
    /** `{n}` menit. */
    nMinutes: string
    duplicateLesson: string
    deleteLessonAttr: string
    deleteLessonDesc: string
    lessonTitleLabel: string
    lessonTypeHead: string
    durationLabel: string
    durationHelp: string
    contentHead: string
    youtubeUrl: string
    youtubeHelp: string
    videoGuideTitle: string
    videoGuide1: string
    videoGuide2: string
    videoGuide3: string
    videoGuide4: string
    transcriptLabel: string
    transcriptPh: string
    transcriptHelp: string
    lessonContentAria: string
    slidesLabel: string
    slidesHelp: string
    /** `{n}` jumlah sumber. */
    resourcesHead: string
    /** `{n}` jumlah soal. */
    quizHead: string
    settingsHead: string
    requiredToContinue: string
    comingSoon: string
    resourcesTitle: string
    resourcesDesc: string
    addLink: string
    addFile: string
    fileUrl: string
    resourceTitleLabel: string
    fileBadge: string
    linkBadge: string
    /** `{nama}` judul sumber. */
    editNamed: string
    lessonNoun: string
    questionNoun: string
    /** `{noun}` dan `{judul}`. */
    dndStart: string
    /** `{noun}`, `{judul}`, `{tujuan}`. */
    dndOver: string
    dndNewPosition: string
    /** `{noun}` dan `{judul}`. */
    dndEndReturn: string
    /** `{noun}`, `{judul}`, `{tujuan}`. */
    dndEnd: string
    /** `{noun}` dan `{judul}`. */
    dndCancel: string
    /** `{noun}`. */
    dndInstructions: string
    answerWritten: string
    answerWrittenHint: string
    answerUpload: string
    answerUploadHint: string
    noPromptsFilled: string
    /** `{n}` tersimpan, `{lewat}` dilewati. */
    savedToBankSkipped: string
    /** `{n}` tersimpan. */
    savedToBank: string
    noQuestions: string
    addQuestion: string
    fromBank: string
    /** `{n}` jumlah soal. */
    saveNToBank: string
    addStudyCase: string
    pickTypeDesc: string
    typeLabel: string
    qtMultipleChoice: string
    qtTrueFalse: string
    qtShortAnswer: string
    qtEssay: string
    passScoreLabel: string
    maxAttemptsLabel: string
    unlimitedPh: string
    unlimited: string
    drawCountLabel: string
    /** `{n}` total soal. */
    allN: string
    shuffleLabel: string
    /** `{n}` soal ditarik, `{total}` seluruh soal. */
    drawNote: string
    studyCase: string
    normalQuiz: string
    /** `{w}` bobot studi kasus. */
    assessmentNote: string
    normalQuizNote: string
    changeModeNote: string
    /** `{n}` nomor soal. */
    moveQuestionAria: string
    /** `{n}` nomor soal. */
    questionN: string
    /** `{n}` poin. */
    nPoints: string
    /** `{n}` nomor soal. */
    deleteQuestionAria: string
    /** `{n}` nomor soal. */
    toggleQuestionAria: string
    promptLabel: string
    /** `{n}` nomor soal. */
    promptAria: string
    allowMultiple: string
    caseSensitive: string
    needAcceptedAnswer: string
    explanationLabel: string
    explanationHelp: string
    explanationPh: string
    answerFormat: string
    notAutoGraded: string
    correctAnswer: string
    acceptedAnswers: string
    choices: string
    addAnswer: string
    addChoice: string
    markCorrect: string
    acceptedAnswerAria: string
    choiceTextAria: string
    removeChoice: string
    rtSizeSmall: string
    rtSizeNormal: string
    rtSizeLarge: string
    rtSizeLarger: string
    rtParagraph: string
    /** `{n}` tingkat judul. */
    rtHeadingN: string
    rtAltPrompt: string
    rtEditorAria: string
    rtTextSize: string
    rtTextColor: string
    rtHighlight: string
    rtBold: string
    rtItalic: string
    rtUnderline: string
    rtStrike: string
    rtUploadingImage: string
    rtInsertImage: string
    rtQuote: string
    rtCodeBlock: string
    rtInsertTable: string
    rtTable: string
    rtAddRowBelow: string
    rtAddColRight: string
    rtDeleteRow: string
    rtDeleteCol: string
    rtDeleteTable: string
    rtAlign: string
    rtAlignLeft: string
    rtAlignCenter: string
    rtAlignRight: string
    rtBulletList: string
    rtOrderedList: string
    /** `{kata}` jumlah kata, `{menit}` menit baca. */
    guideWordCount: string
    guideTooLong: string
    guideTarget: string
    /** `{n}` menit. */
    guideUseDuration: string
    guideTip1: string
    guideTip2: string
    guideTip3: string
    guideTip4: string
    guideTip5: string
    blankCourse: string
    blankCourseDesc: string
    importMd: string
    importMdDesc: string
    creatingCourse: string
    courseDeleted: string
    deleteCourseAria: string
    deleteCourseDesc: string
    movingToDraft: string
    publishing: string
    publishedBadge: string
    draftBadge: string
    movedToDraft: string
    publishedShort: string
    publishedClickDraft: string
    draftClickPublish: string
    /** `{judul}` judul kursus. */
    moveToDraftTitle: string
    moveToDraftDesc: string
    moveToDraft: string
    previewCourse: string
    editCourseAria: string
    noCourses: string
    noCourseFilterMatches: string
    mdPickFile: string
    mdFileRead: string
    mdImportExport: string
    mdTitle: string
    mdDesc: string
    mdStep1: string
    mdStep1Desc: string
    mdStep2: string
    mdStep2Desc1: string
    mdStep2Desc2: string
    mdStep3: string
    mdReading: string
    mdPickFileBtn: string
    /** `{n}` jumlah pendaftaran. */
    mdLockedByLearners: string
    /** `{modul}`, `{pelajaran}`, `{soal}`. */
    mdReport: string
    mdWarningsIntro: string
    mdNoWarnings: string
    mdResultNote: string
    mdExportThis: string
    bankNonePicked: string
    /** `{n}` jumlah soal. */
    bankCopied: string
    bankTitle: string
    bankCopyNote1: string
    bankCopyNote2: string
    bankNotReadyPrefix: string
    bankSearchPh: string
    bankSearchAria: string
    loadingShort: string
    bankEmpty: string
    /** `{n}` jumlah soal, `{dipilih}` yang dipilih. */
    bankCount: string
    /** `{soal}` cuplikan teks soal. */
    bankPickAria: string
    bankCopyToQuiz: string
    bankCopiedWord: string
  }
  courseDetail: {
    summary: string
    contents: string
    whoFor: string
    requirements: string
    instructorRole: string
    reviews: string
    backToCourses: string
    backToEditor: string
    /** `{n}` jumlah sumber belajar. */
    nResources: string
    /** `{n}` jumlah peserta. */
    nEnrolled: string
    courseGrade: string
    /** `{n}` jumlah studi kasus. */
    pendingGradeNote: string
    notesPrivate: string
    notesEmpty: string
    /** `{waktu}` tanggal-jam. */
    notesUpdated: string
    openLessonLink: string
    needEnrollTitle: string
    needEnrollDesc: string
    enrolledToastOk: string
    enrollPending: string
  }
  superadmin: {
    mentorTitle: string
    seeMentorEvaluation: string
    /** `{mentor}`, `{kursus}`, `{peserta}` diganti angka. */
    mentorSummary: string
    /** `{n}` esai menunggu. */
    mentorPendingSuffix: string
    mentorSubtitle: string
    mentorStat: string
    publishedCourses: string
    learnersReached: string
    essaysPending: string
    noBacklog: string
    learnersWaiting: string
    noMentors: string
    noMentorsHint: string
    scrollMentors: string
    colMentor: string
    colCompletion: string
    colReviews: string
    colPendingGrade: string
    /** `{n}` kursus terbit. */
    nPublished: string
    /** `{n}` total kursus. */
    ofNCourses: string
    /** `{n}` pendaftaran. */
    nEnrollments: string
    noEnrollmentsYet: string
    /** `{selesai}` dan `{total}`. */
    completedOf: string
    noReviewsYet: string
    /** `{n}` ulasan. */
    nReviews: string
    /** `{nilai}` rata-rata, `{n}` jumlah ulasan. */
    avgAllMentors: string
    certDefaultsSaved: string
    certDefaultsTitle: string
    certDefaultsSubtitle: string
    certDefaultsNotReady1: string
    certDefaultsNotReady2: string
    certDefaultsNotReady3: string
    signatureImage: string
    savePrefs: string
    colorsSaved: string
    landingColors: string
    landingColorsDesc: string
    primaryColor: string
    softSurface: string
    textColor: string
    /** `{label}` nama warna. */
    colorPickerAria: string
    contrastTextOnSurface: string
    contrastWhiteOnButton: string
    contrastPrimaryOnWhite: string
    contrastPass: string
    contrastMin: string
    saveColors: string
    featuredCoursesAria: string
    previewHead: string
    livePreviewNote: string
    editThisSection: string
    duplicateBlock: string
    addSectionTitle: string
    addSectionHint: string
    dragHandleBlock: string
    deviceWidth: string
    deviceDesktop: string
    deviceTablet: string
    devicePhone: string
    reload: string
    previewSavedNote: string
    landingPreviewTitle: string
    certPreviewFailed: string
    certPreviewHead: string
    certPreviewDesc: string
    updating: string
    openNewTab: string
    certPreviewTitle: string
    certPreviewUnavailable: string
    certPreviewPreparing: string
    certPreviewBlankHint: string
    landingSaved: string
    landingTitle: string
    landingSubtitle: string
    addSection: string
    hiddenBadge: string
    /** `{nama}` nama blok. */
    moveUp: string
    /** `{nama}` nama blok. */
    moveDown: string
    /** `{nama}` nama blok. */
    showBlock: string
    /** `{nama}` nama blok. */
    hideBlock: string
    noBlocks: string
    blockHero: string
    blockCourses: string
    blockFeatures: string
    blockStats: string
    blockCategories: string
    blockSteps: string
    blockLogos: string
    blockInstructors: string
    blockAlumni: string
    alumniName: string
    alumniRole: string
    alumniCompany: string
    alumniQuote: string
    alumniPhoto: string
    addAlumni: string
    deleteAlumniN: string
    alumniNote: string
    stepN: string
    addStep: string
    deleteStepN: string
    logoName: string
    logoImage: string
    addLogo: string
    deleteLogoN: string
    logoNameRequired: string
    categoriesNote: string
    instructorsNote: string
    statLearners: string
    statCourses: string
    statEnrollments: string
    statsHiddenNote: string
    blockTestimonials: string
    blockFaq: string
    blockCta: string
    fieldHeading: string
    fieldHighlight: string
    fieldCtaText: string
    fieldCtaHref: string
    fieldSubheading: string
    coursesEmptyNote: string
    /** `{n}` jumlah ulasan. */
    testimonialsNote: string
    /** `{n}` jumlah keunggulan. */
    featuresNote: string
    /** `{n}` nomor. */
    faqQuestionN: string
    /** `{n}` nomor. */
    faqAnswerN: string
    addFaq: string
    fieldPrimaryBtn: string
    fieldPrimaryHref: string
    fieldSecondaryBtn: string
    fieldSecondaryHref: string
    landingUpdated: string
    heroSection: string
    mainHeading: string
    ctaButtonText: string
    ctaButtonHref: string
    featuresHead: string
    addFeature: string
    /** `{n}` nomor. */
    featureN: string
    /** `{n}` nomor. */
    deleteFeatureN: string
    iconLabel: string
    iconGradCap: string
    iconLayers: string
    iconAward: string
    descriptionLabel: string
    /** `{n}` nomor. */
    featureDescAria: string
    featuredCoursesHead: string
    featuredCoursesDesc: string
    saveFailedFillMarked: string
    langTabsAria: string
    enFallbackNote: string
    idVersionNote: string
    enEmptyTitle: string
    enEmptyDesc: string
    copyFromId: string
    landingSavedEn: string
    sectionNoun: string
    hintHero: string
    hintStats: string
    hintCategories: string
    hintCourses: string
    hintFeatures: string
    hintSteps: string
    hintInstructors: string
    hintAlumni: string
    hintLogos: string
    blockGallery: string
    hintGallery: string
    heroImage: string
    heroTrustText: string
    heroTrustBadges: string
    trustBadgeLabel: string
    trustBadgeScore: string
    trustBadgeLogo: string
    addTrustBadge: string
    deleteTrustBadgeN: string
    logoVariant: string
    logoVariantWall: string
    logoVariantStrip: string
    logoCaption: string
    logoCount: string
    bulkUploadLabel: string
    bulkUploadHint: string
    bulkUploadProgress: string
    bulkUploadDone: string
    bulkUploadFailed: string
    removeAllItems: string
    alumniBefore: string
    alumniCompanyLogo: string
    alumniLink: string
    galleryCaption: string
    deletePhotoN: string
    sourceLabel: string
    sourceReal: string
    sourceManual: string
    sourceManualWarning: string
    manualStatLabel: string
    manualStatValue: string
    addStat: string
    deleteStatN: string
    manualTestimonialName: string
    manualTestimonialRating: string
    manualTestimonialComment: string
    addTestimonial: string
    deleteTestimonialN: string
    manualInstructorName: string
    manualInstructorTitle: string
    manualInstructorBio: string
    manualInstructorPhoto: string
    addInstructor: string
    deleteInstructorN: string
    hintTestimonials: string
    hintFaq: string
    hintCta: string
    statusPublished: string
    statusDraft: string
    undo: string
    redo: string
    discardDraft: string
    restoreDefaults: string
    openInNewTab: string
    saveDraft: string
    publish: string
    builderTabsAria: string
    tabStructure: string
    tabBlockSettings: string
    tabTheme: string
    clickAnySection: string
    editSectionAria: string
    draftSaved: string
    published: string
    draftDiscarded: string
    defaultsRestored: string
    draftNote: string
    noBlockSelected: string
    confirmRestore: string
    confirmDiscard: string
    seoTitle: string
    seoSubtitle: string
    seoPageTitle: string
    seoPageDescription: string
    seoOgImage: string
    seoOgHint: string
    seoTooLong: string
    seoEmptyFallback: string
    seoPreviewHead: string
    seoSaved: string
    seoPublished: string
    testimonialsLimit: string
    blockWhatsapp: string
    hintWhatsapp: string
    logoVariantMarquee: string
    waNumber: string
    waLabel: string
    waMessage: string
    waPreview: string
    waInvalid: string
  }
  catalog: {
    navClasses: string
    title: string
    subtitle: string
    searchPlaceholder: string
    filterLevel: string
    filterCategory: string
    allCategories: string
    /** `{n}` jumlah kelas. */
    categoryCourses: string
    categoryCoursesOne: string
    allLevels: string
    levelNotSet: string
    filterAccess: string
    allAccess: string
    accessFree: string
    accessPaid: string
    filterDuration: string
    allDurations: string
    durationShort: string
    durationMedium: string
    durationLong: string
    sortLabel: string
    sortNewest: string
    sortTitle: string
    sortShortest: string
    sortLongest: string
    /** `{n}` jumlah kelas yang cocok. */
    resultCount: string
    resultCountOne: string
    /** `{n}` jumlah seluruh kelas. */
    resultCountFiltered: string
    noResults: string
    noResultsHint: string
    resetFilters: string
    emptyCatalog: string
    emptyCatalogHint: string
    viewDetail: string
    /** `{n}` jumlah peserta. */
    learners: string
    learnersOne: string
    /** `{n}` rata-rata, `{c}` jumlah ulasan. */
    rating: string
    backToCatalog: string
    aboutCourse: string
    whatYouGet: string
    curriculum: string
    curriculumNote: string
    /** `{modul}` dan `{pelajaran}`. */
    curriculumCount: string
    curriculumCountOne: string
    instructor: string
    courseFacts: string
    factLevel: string
    factCategory: string
    factLanguage: string
    factDuration: string
    factLessons: string
    factCertificate: string
    certificateYes: string
    certificateNo: string
    benefitLifetime: string
    benefitLifetimeDesc: string
    benefitSelfPaced: string
    benefitSelfPacedDesc: string
    /** `{n}` jumlah sumber belajar. */
    benefitResources: string
    benefitResourcesOne: string
    benefitResourcesDesc: string
    /** `{n}` jumlah kuis. */
    benefitQuizzes: string
    benefitQuizzesOne: string
    benefitQuizzesDesc: string
    benefitCertificate: string
    benefitCertificateDesc: string
    enroll: string
    enrollFree: string
    loginToEnroll: string
    loginNote: string
    alreadyEnrolled: string
    continueLearning: string
    notFoundTitle: string
    notFoundHint: string
    previewOnly: string
    freeLabel: string
    typeVideo: string
    typeText: string
    typeQuiz: string
    typeSlides: string
    /** `{n}` jumlah soal. */
    nQuestions: string
    nQuestionsOne: string
    typeMixed: string
    paidNotice: string
    enrollingNow: string
    /** `{n}` jumlah pelajaran di satu modul. */
    moduleLessons: string
    moduleLessonsOne: string
    /** `{n}` menit. */
    minutes: string
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
    seo: string
    orgTitle: string
    orgSubtitle: string
    orgDepartments: string
    orgJobTitles: string
    orgAddDepartment: string
    orgAddJobTitle: string
    orgDepartmentName: string
    orgJobTitleName: string
    orgNoDepartment: string
    orgCourses: string
    orgAddCourse: string
    orgRequirement: string
    orgDueDays: string
    orgNoCourses: string
    orgPeople: string
    orgAssign: string
    orgAssignFor: string
    orgSaved: string
    orgPurpose: string
    orgSelectJobTitle: string
    orgSelectCourse: string
    orgEmpty: string
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
    viewProfile: string
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
    languageTitle: "Bahasa",
    languageHint:
      "Bahasa antarmuka LMS untuk akun Anda. Berlaku langsung, dan ikut tersimpan di profil sehingga sama di perangkat lain.",
    languageSaved: "Bahasa disimpan",
    deletingBlockMessage: "Penghapusan akun sedang berjalan. Tetap tinggalkan halaman ini?",
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
    forYourJob: "Untuk jabatan Anda",
    jobRequired: "Wajib",
    jobSuggested: "Disarankan",
    jobReasonRequired: "Wajib untuk {jabatan}",
    jobReasonSuggested: "Disarankan untuk {jabatan}",
    jobDueIn: "tenggat {tanggal}",
    jobOverdue: "lewat tenggat {tanggal}",
    jobStart: "Mulai",
    jobContinue: "Lanjutkan",
    jobEnrollNow: "Daftar",
    jobNoneYet: "Belum ada kursus untuk jabatan Anda.",
    noRecommendations: "Belum ada rekomendasi",
    start: "Mulai",
    continue: "Lanjutkan",
    learners: "Peserta",
    of: "dari",
    lessonsProgress: "pelajaran selesai",
  },
  courses: {
    accessPrivate: "Privat",
    accessPublic: "Publik",
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
    category: "Kategori",
    pickCategory: "Pilih kategori",
    noCategory: "Tanpa kategori",
    newCategory: "Kategori baru",
    newCategoryLabel: "Nama kategori",
    newCategoryPh: "misal: Pemrograman",
    categoryCreated: "Kategori dibuat dan dipilih",
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
    lessonTypeVideo: "Pelajaran Video",
    lessonTypeVideoDesc: "Konten pelajaran berupa video",
    lessonTypeText: "Pelajaran Teks",
    lessonTypeTextDesc: "Konten pelajaran berupa teks",
    lessonTypePpt: "Pelajaran Slide",
    lessonTypePptDesc: "Konten pelajaran berupa presentasi Google Slides",
    lessonTypeQuiz: "Pelajaran Kuis",
    lessonTypeQuizDesc: "Pelajaran berupa kuis untuk menguji materi sebelumnya",
    courseLessons: "Pelajaran Kursus",
    addModule: "Tambah Modul",
    noModules: "Belum ada modul. Klik Tambah Modul untuk mulai menyusun kursus.",
    unnamedModule: "Modul Tanpa Nama",
    untitledLesson: "Pelajaran Tanpa Judul",
    lessonN: "Pelajaran {n}",
    moveModuleAria:
      "Pindahkan modul {judul}: tekan Spasi untuk mengambil, tombol panah untuk memindahkan, Spasi untuk melepas",
    moveLessonAria:
      "Pindahkan {judul}: tekan Spasi untuk mengambil, tombol panah untuk memindahkan, Spasi untuk melepas",
    clickToRename: "Klik untuk mengganti nama",
    deleteModuleAttr: "Hapus modul",
    deleteTitled: "Hapus \u201C{judul}\u201D?",
    deleteSectionDesc:
      "Modul ini beserta {n} pelajarannya (termasuk sumber belajar dan kuisnya) akan dihapus dari draf. Tidak ada yang dihapus dari database sampai Anda menekan Simpan.",
    toggleOpen: "Buka/tutup",
    noLessonsInModule: "Belum ada pelajaran di modul ini.",
    addLesson: "Tambah Pelajaran",
    complete: "Lengkap",
    incomplete: "Belum lengkap",
    nQuizIssues: "{n} masalah kuis",
    nMinutes: "{n} menit",
    duplicateLesson: "Duplikat pelajaran",
    deleteLessonAttr: "Hapus pelajaran",
    deleteLessonDesc:
      "Pelajaran ini beserta seluruh sumber belajarnya akan dihapus dari draf. Tidak ada yang dihapus dari database sampai Anda menekan Simpan.",
    lessonTitleLabel: "Judul Pelajaran",
    lessonTypeHead: "Jenis Pelajaran",
    durationLabel: "Perkiraan Durasi (menit)",
    durationHelp: "Ditampilkan kepada peserta. Usahakan 5\u20137 menit per pelajaran.",
    contentHead: "Konten",
    youtubeUrl: "URL Video YouTube",
    youtubeHelp: "Tempel tautan YouTube lengkap untuk video pelajaran ini",
    videoGuideTitle: "Memilih video untuk pelajaran ini",
    videoGuide1:
      "Satu tujuan belajar per pelajaran; 5\u20137 menit lebih mudah diselesaikan daripada satu video panjang.",
    videoGuide2:
      "Utamakan video yang sudah bertakarir. Kalau belum, isi Transkrip di bawah \u2014 tanpa salah satunya, peserta tuli tidak bisa mengikuti pelajaran ini.",
    videoGuide3: "Sebutkan di awal apa yang akan mampu dilakukan peserta setelah menonton.",
    videoGuide4: "Akhiri modul dengan pelajaran kuis agar peserta mengingat kembali isinya.",
    transcriptLabel: "Transkrip",
    transcriptPh: "Tempel teks lengkap yang diucapkan di video ini.",
    transcriptHelp:
      "Wajib bila videonya tidak bertakarir. Tanpa ini, peserta yang tuli atau yang menonton tanpa suara tidak bisa mengikuti pelajaran sama sekali (WCAG 1.2.2). Transkrip juga membantu peserta mencari kembali satu bagian tanpa memutar ulang seluruh video.",
    lessonContentAria: "Konten pelajaran",
    slidesLabel: "Tautan Google Slides",
    slidesHelp: "Tempel tautan berbagi Google Slides atau tautan \u201CPublikasikan ke web\u201D",
    resourcesHead: "Sumber Belajar ({n})",
    quizHead: "Kuis ({n} soal)",
    settingsHead: "Pengaturan",
    requiredToContinue: "Wajib untuk Melanjutkan",
    comingSoon: "Segera hadir. Memerlukan skema data baru.",
    resourcesTitle: "Sumber Belajar",
    resourcesDesc: "Tambahkan berkas, dokumen, atau tautan untuk melengkapi konten pelajaran",
    addLink: "Tambah Tautan",
    addFile: "Tambah Berkas",
    fileUrl: "URL Berkas",
    resourceTitleLabel: "Judul Sumber Belajar",
    fileBadge: "Berkas",
    linkBadge: "Tautan",
    editNamed: "Ubah {nama}",
    lessonNoun: "Pelajaran",
    questionNoun: "Soal",
    dndStart:
      "Mengangkat {noun} {judul}. Pakai panah atas dan bawah untuk memindahkan, spasi untuk menjatuhkan, Escape untuk membatalkan.",
    dndOver: "{noun} {judul} berada di atas {tujuan}.",
    dndNewPosition: "posisi baru",
    dndEndReturn: "{noun} {judul} dikembalikan ke posisi semula.",
    dndEnd: "{noun} {judul} dijatuhkan di {tujuan}.",
    dndCancel: "Pemindahan dibatalkan. {noun} {judul} kembali ke posisi semula.",
    dndInstructions:
      "Tekan spasi atau Enter untuk mulai memindahkan {noun} ini. Lalu pakai panah atas dan bawah untuk memilih posisi, spasi untuk menjatuhkan, dan Escape untuk membatalkan.",
    answerWritten: "Jawaban tertulis",
    answerWrittenHint: "Peserta mengetik jawaban di kotak teks.",
    answerUpload: "Unggah berkas atau tautan",
    answerUploadHint: "Peserta mengirim tautan ke berkasnya (misal Google Drive), bukan mengetik.",
    noPromptsFilled: "Belum ada soal yang teksnya terisi",
    savedToBankSkipped: "{n} soal disimpan ke bank, {lewat} dilewati karena masih kosong",
    savedToBank: "{n} soal disimpan ke bank",
    noQuestions: "Belum ada soal. Tambahkan soal, atau jadikan pelajaran ini studi kasus.",
    addQuestion: "Tambah Soal",
    fromBank: "Ambil dari Bank",
    saveNToBank: "Simpan {n} soal ke Bank",
    addStudyCase: "Tambah Studi Kasus",
    pickTypeDesc: "Pilih jenis soal. Jenis ini tidak dapat diubah nanti.",
    typeLabel: "Jenis",
    qtMultipleChoice: "Pilihan Ganda",
    qtTrueFalse: "Benar / Salah",
    qtShortAnswer: "Isian Singkat",
    qtEssay: "Esai",
    passScoreLabel: "Nilai Lulus (%)",
    maxAttemptsLabel: "Maks. Percobaan",
    unlimitedPh: "Tidak terbatas",
    unlimited: "Tanpa batas",
    drawCountLabel: "Soal per Percobaan",
    allN: "Semua ({n})",
    shuffleLabel: "Acak Soal",
    drawNote:
      "Tiap peserta menghadapi {n} soal acak dari {total}. Soalnya dipilih saat percobaan dimulai dan tetap sama sampai percobaan itu selesai. Karena kumpulan soalnya berbeda-beda, nilai antarpeserta tidak lagi langsung sebanding \u2014 pastikan seluruh soal setara tingkat kesulitannya.",
    studyCase: "Studi Kasus",
    normalQuiz: "Kuis Biasa",
    assessmentNote:
      "Tanpa tombol mulai atau batas waktu; peserta menyimpan draf dan mengirim jika sudah selesai. Nilai secara manual di Admin \u203A Penilaian. Bobotnya {w}\u00D7 kuis biasa dalam nilai akhir kursus.",
    normalQuizNote: "Dinilai otomatis dan langsung mendapat skor saat dikirim.",
    changeModeNote: "Untuk mengganti mode, hapus dulu semua soal di kuis ini.",
    moveQuestionAria:
      "Pindahkan soal {n}: tekan Spasi untuk mengambil, tombol panah untuk memindahkan, Spasi untuk melepas",
    questionN: "Soal {n}",
    nPoints: "{n} poin",
    deleteQuestionAria: "Hapus soal {n}",
    toggleQuestionAria: "Buka/tutup soal {n}",
    promptLabel: "Pertanyaan",
    promptAria: "Pertanyaan soal {n}",
    allowMultiple: "Izinkan lebih dari satu jawaban benar",
    caseSensitive: "Huruf besar/kecil berpengaruh",
    needAcceptedAnswer:
      "Tambahkan minimal satu jawaban yang diterima. Kuis biasa harus dapat dinilai otomatis.",
    explanationLabel: "Penjelasan (opsional)",
    explanationHelp:
      "Ditampilkan kepada peserta setelah mengirim jawaban: mengapa jawaban itu benar, dan materi apa yang perlu dipelajari ulang jika salah. Cukup satu atau dua kalimat sederhana.",
    explanationPh: "misal: Mengingat kembali lebih efektif daripada membaca ulang. Pelajari lagi pelajaran 2.",
    answerFormat: "Format jawaban",
    notAutoGraded: "Jawaban jenis ini tidak dinilai otomatis.",
    correctAnswer: "Jawaban Benar",
    acceptedAnswers: "Jawaban yang Diterima",
    choices: "Pilihan",
    addAnswer: "Tambah Jawaban",
    addChoice: "Tambah Pilihan",
    markCorrect: "Tandai sebagai jawaban benar",
    acceptedAnswerAria: "Jawaban yang diterima",
    choiceTextAria: "Teks pilihan",
    removeChoice: "Hapus pilihan",
    rtSizeSmall: "Kecil",
    rtSizeNormal: "Normal",
    rtSizeLarge: "Besar",
    rtSizeLarger: "Lebih besar",
    rtParagraph: "Paragraf",
    rtHeadingN: "Judul {n}",
    rtAltPrompt:
      "Jelaskan gambar ini untuk peserta yang tidak dapat melihatnya (apa isinya dan mengapa penting).\nKosongkan jika gambar hanya hiasan.",
    rtEditorAria: "Editor konten",
    rtTextSize: "Ukuran teks",
    rtTextColor: "Warna teks",
    rtHighlight: "Sorot",
    rtBold: "Tebal",
    rtItalic: "Miring",
    rtUnderline: "Garis bawah",
    rtStrike: "Coret",
    rtUploadingImage: "Mengunggah gambar\u2026",
    rtInsertImage: "Sisipkan gambar",
    rtQuote: "Kutipan",
    rtCodeBlock: "Blok kode",
    rtInsertTable: "Sisipkan tabel",
    rtTable: "Tabel",
    rtAddRowBelow: "Tambah baris di bawah",
    rtAddColRight: "Tambah kolom di kanan",
    rtDeleteRow: "Hapus baris",
    rtDeleteCol: "Hapus kolom",
    rtDeleteTable: "Hapus tabel",
    rtAlign: "Perataan teks",
    rtAlignLeft: "Kiri",
    rtAlignCenter: "Tengah",
    rtAlignRight: "Kanan",
    rtBulletList: "Daftar berbutir",
    rtOrderedList: "Daftar bernomor",
    guideWordCount: "{kata} kata \u00B7 sekitar {menit} menit membaca",
    guideTooLong:
      "Lebih dari 10 menit: pertimbangkan membaginya menjadi dua pelajaran dengan satu tujuan masing-masing.",
    guideTarget: "Usahakan 5\u20137 menit dan satu tujuan belajar per pelajaran.",
    guideUseDuration: "Gunakan {n} menit sebagai durasi",
    guideTip1: "Awali dengan satu kalimat tentang apa yang akan mampu dilakukan peserta.",
    guideTip2: "Gunakan subjudul dan paragraf pendek: kebanyakan pembaca memindai sebelum membaca.",
    guideTip3: "Jelaskan setiap istilah teknis saat pertama kali muncul.",
    guideTip4: "Berikan contoh dari pekerjaan nyata sebelum aturannya.",
    guideTip5: "Akhiri dengan latihan singkat (pelajaran kuis) agar peserta mengingat kembali isi bacaan.",
    blankCourse: "Kursus kosong",
    blankCourseDesc: "Isi sendiri dari awal",
    importMd: "Impor dari berkas .md",
    importMdDesc: "Hasil dari asisten AI Anda",
    creatingCourse: "Membuat\u2026",
    courseDeleted: "Kursus dihapus",
    deleteCourseAria: "Hapus kursus",
    deleteCourseDesc:
      "Kursus beserta seluruh modul, pelajaran, dan sumber belajarnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.",
    movingToDraft: "Memindahkan\u2026",
    publishing: "Menerbitkan\u2026",
    publishedBadge: "Terbit",
    draftBadge: "Draf",
    movedToDraft: "Dipindahkan ke draf",
    publishedShort: "Diterbitkan",
    publishedClickDraft: "Terbit. Klik untuk memindahkan ke draf",
    draftClickPublish: "Draf. Klik untuk menerbitkan",
    moveToDraftTitle: "Pindahkan \u201C{judul}\u201D ke draf?",
    moveToDraftDesc:
      "Kursus akan hilang dari katalog dan peserta yang sedang mengikutinya tidak bisa lagi membukanya. Progres mereka tetap tersimpan, dan Anda bisa menerbitkannya kembali kapan saja.",
    moveToDraft: "Pindahkan ke draf",
    previewCourse: "Pratinjau kursus",
    editCourseAria: "Ubah kursus",
    noCourses: "Belum ada kursus. Klik Buat Kursus untuk menambahkan kursus pertama Anda.",
    noCourseFilterMatches: "Tidak ada kursus yang cocok dengan filter Anda.",
    mdPickFile: "Pilih berkas .md",
    mdFileRead: "Berkas terbaca. Periksa hasilnya, lalu simpan.",
    mdImportExport: "Impor / ekspor",
    mdTitle: "Susun kursus dengan bantuan AI",
    mdDesc:
      "Sanggabiz tidak memanggil AI. Anda memakai asisten AI yang sudah Anda punya, lalu mengimpor hasilnya ke sini.",
    mdStep1: "Unduh panduan penulisan",
    mdStep1Desc: "Berisi format berkas dan aturan menulis pelajaran yang baik.",
    mdStep2: "Bawa ke asisten AI Anda",
    mdStep2Desc1: "Buka ChatGPT, Claude, atau yang lain. Berikan panduan itu bersama materi dan SOP Anda, lalu minta satu berkas",
    mdStep2Desc2: "sebagai keluarannya.",
    mdStep3: "Unggah hasilnya",
    mdReading: "Membaca\u2026",
    mdPickFileBtn: "Pilih berkas .md",
    mdLockedByLearners:
      "Kursus ini sudah punya {n} pendaftaran, jadi isinya tidak bisa diganti lewat impor. Ekspor di bawah tetap bisa dipakai.",
    mdReport: "Terbaca: {modul} modul, {pelajaran} pelajaran, {soal} soal",
    mdWarningsIntro: "Beberapa bagian dilewati atau dibetulkan sendiri:",
    mdNoWarnings: "Tidak ada yang terlewat.",
    mdResultNote: "Hasilnya sudah masuk ke editor sebagai draf. Periksa dulu, lalu tekan Simpan.",
    mdExportThis: "Ekspor kursus ini",
    bankNonePicked: "Belum ada soal yang dipilih",
    bankCopied: "{n} soal disalin dari bank",
    bankTitle: "Ambil dari Bank Soal",
    bankCopyNote1: "Soal yang dipilih",
    bankCopyNote2: "ke kuis ini. Menyuntingnya di sini tidak mengubah soal di bank.",
    bankNotReadyPrefix: "Bank soal belum aktif: tabel",
    bankSearchPh: "Cari teks soal atau label\u2026",
    bankSearchAria: "Cari soal di bank",
    loadingShort: "Memuat\u2026",
    bankEmpty: "Belum ada soal di bank. Simpan soal ke bank dari editor kuis lebih dulu.",
    bankCount: "{n} soal, {dipilih} dipilih",
    bankPickAria: "Pilih soal: {soal}",
    bankCopyToQuiz: "Salin ke Kuis",
    bankCopiedWord: "disalin",
  },
  courseDetail: {
    summary: "Ringkasan Kursus",
    contents: "Isi kursus",
    whoFor: "Untuk Siapa Kursus Ini",
    requirements: "Persyaratan",
    instructorRole: "Instruktur Kursus",
    reviews: "Ulasan",
    backToCourses: "Kembali ke daftar kursus",
    backToEditor: "Kembali ke editor kursus",
    nResources: "{n} sumber belajar",
    nEnrolled: "{n} peserta terdaftar",
    courseGrade: "Nilai Kursus",
    pendingGradeNote: "{n} studi kasus menunggu penilaian instruktur. Nilai masih dapat naik.",
    notesPrivate: "Hanya Anda yang dapat melihat catatan ini.",
    notesEmpty:
      "Anda belum menulis catatan di kursus ini. Tulis catatan di bawah materi pelajaran, dan catatan itu akan muncul di sini.",
    notesUpdated: "Diperbarui {waktu}",
    openLessonLink: "Buka pelajaran",
    needEnrollTitle: "Perlu mendaftar",
    needEnrollDesc: "Anda perlu mengikuti kursus ini sebelum mulai belajar.",
    enrolledToastOk: "Anda sudah terdaftar. Silakan mulai belajar.",
    enrollPending: "Mendaftarkan\u2026",
  },
  superadmin: {
    mentorTitle: "Mentor",
    seeMentorEvaluation: "Lihat evaluasi mentor",
    mentorSummary: "{mentor} mentor mengelola {kursus} kursus terbit untuk {peserta} peserta.",
    mentorPendingSuffix: "{n} esai menunggu dinilai.",
    mentorSubtitle: "Kinerja tiap mentor berdampingan. Angka ini untuk membantu mereka, bukan memeringkat.",
    mentorStat: "Mentor",
    publishedCourses: "Kursus Terbit",
    learnersReached: "Peserta Dijangkau",
    essaysPending: "Esai Menunggu Dinilai",
    noBacklog: "Tidak ada tunggakan",
    learnersWaiting: "Peserta sedang menunggu",
    noMentors: "Belum ada mentor",
    noMentorsHint:
      "Seseorang menjadi mentor ketika perannya diubah menjadi mentor. Setelah itu ia dapat menyusun dan mengelola kursusnya sendiri.",
    scrollMentors: "Kinerja mentor, dapat digulir mendatar",
    colMentor: "Mentor",
    colCompletion: "Penyelesaian",
    colReviews: "Ulasan",
    colPendingGrade: "Menunggu dinilai",
    nPublished: "{n} terbit",
    ofNCourses: "dari {n} kursus",
    nEnrollments: "{n} pendaftaran",
    noEnrollmentsYet: "belum ada pendaftaran",
    completedOf: "{selesai} dari {total}",
    noReviewsYet: "belum ada ulasan",
    nReviews: "{n} ulasan",
    avgAllMentors: "Rata-rata ulasan seluruh mentor: {nilai} dari {n} ulasan.",
    certDefaultsSaved: "Pengaturan sertifikat tersimpan",
    certDefaultsTitle: "Sertifikat",
    certDefaultsSubtitle:
      "Dipakai setiap kursus yang tidak mengatur sertifikatnya sendiri. Kursus hasil kerja sama dengan perusahaan lain cukup mengisi ruas yang memang berbeda; sisanya tetap mengikuti pengaturan di halaman ini.",
    certDefaultsNotReady1: "Tabel",
    certDefaultsNotReady2: "belum ada di basis data, jadi pengaturan di halaman ini belum bisa disimpan. Jalankan",
    certDefaultsNotReady3:
      "di SQL Editor Supabase lebih dulu. Sampai itu dijalankan, sertifikat tetap terbit memakai pengaturan masing-masing kursus seperti sebelumnya.",
    signatureImage: "Gambar Tanda Tangan",
    savePrefs: "Simpan Pengaturan",
    colorsSaved: "Warna tersimpan",
    landingColors: "Warna Halaman Depan",
    landingColorsDesc: "Hanya memengaruhi halaman depan. Layar belajar dan layar pengelola tetap memakai palet bawaan.",
    primaryColor: "Warna utama",
    softSurface: "Latar lembut",
    textColor: "Warna teks",
    colorPickerAria: "{label} (pemilih warna)",
    contrastTextOnSurface: "Teks di atas latar",
    contrastWhiteOnButton: "Teks putih di tombol",
    contrastPrimaryOnWhite: "Warna utama di atas putih",
    contrastPass: "lulus",
    contrastMin: "minimal 4,5:1",
    saveColors: "Simpan Warna",
    featuredCoursesAria: "Kursus unggulan",
    previewHead: "Pratinjau",
    livePreviewNote: "Ikut berubah saat Anda mengetik. Belum tersimpan sampai Anda menekan Simpan.",
    editThisSection: "Sunting bagian ini",
    duplicateBlock: "Duplikat {nama}",
    addSectionTitle: "Tambah bagian",
    addSectionHint: "Pilih bagian yang ingin Anda tambahkan ke halaman depan.",
    dragHandleBlock: "Pindahkan {nama}: tekan Spasi untuk mengambil, tombol panah untuk memindahkan, Spasi untuk melepas",
    deviceWidth: "Lebar perangkat",
    deviceDesktop: "Desktop",
    deviceTablet: "Tablet",
    devicePhone: "Ponsel",
    reload: "Muat ulang",
    previewSavedNote: "Menampilkan halaman depan yang sudah tersimpan. Perubahan yang belum disimpan belum terlihat di sini.",
    landingPreviewTitle: "Pratinjau halaman depan",
    certPreviewFailed: "Pratinjau gagal dibuat",
    certPreviewHead: "Pratinjau",
    certPreviewDesc: "Contoh hasil dengan data peserta sekadar contoh. Dirender memakai dokumen yang sama dengan sertifikat yang benar-benar diterbitkan.",
    updating: "Memperbarui\u2026",
    openNewTab: "Buka di tab baru",
    certPreviewTitle: "Pratinjau sertifikat",
    certPreviewUnavailable: "Pratinjau tidak tersedia",
    certPreviewPreparing: "Menyiapkan pratinjau\u2026",
    certPreviewBlankHint: "Bingkainya kosong? Browser Anda mungkin tidak menampilkan PDF di dalam halaman \u2014 pakai \u201CBuka di tab baru\u201D untuk melihatnya.",
    landingSaved: "Halaman depan tersimpan",
    landingTitle: "Halaman Depan",
    landingSubtitle: "Susun bagian halaman depan: tambah, sembunyikan, hapus, dan urutkan.",
    addSection: "Tambah Bagian",
    hiddenBadge: "Disembunyikan",
    moveUp: "Pindahkan {nama} ke atas",
    moveDown: "Pindahkan {nama} ke bawah",
    showBlock: "Tampilkan {nama}",
    hideBlock: "Sembunyikan {nama}",
    noBlocks: "Belum ada bagian. Tambahkan setidaknya satu sebelum menyimpan.",
    blockHero: "Bagian Utama",
    blockCourses: "Kursus Pilihan",
    blockFeatures: "Keunggulan",
    blockStats: "Angka Platform",
    blockCategories: "Pilihan Bidang",
    blockSteps: "Cara Mulai",
    blockLogos: "Logo Mitra",
    blockInstructors: "Pengajar",
    blockAlumni: "Kisah Alumni",
    alumniName: "Nama",
    alumniRole: "Posisi",
    alumniCompany: "Perusahaan atau institusi",
    alumniQuote: "Kutipan",
    alumniPhoto: "Foto",
    addAlumni: "Tambah kisah alumni",
    deleteAlumniN: "Hapus kisah alumni {n}",
    alumniNote: "Tulis kutipan yang memang dikumpulkan untuk dipublikasikan, dengan izin orangnya. Bagian ini menyebut nama dan tempat kerja.",
    stepN: "Langkah {n}",
    addStep: "Tambah langkah",
    deleteStepN: "Hapus langkah {n}",
    logoName: "Nama mitra",
    logoImage: "Logo",
    addLogo: "Tambah mitra",
    deleteLogoN: "Hapus mitra {n}",
    logoNameRequired: "Nama mitra wajib diisi; logonya boleh kosong.",
    categoriesNote: "Kategori dan jumlah kelasnya dibaca dari basis data. Yang kosong tidak ditampilkan.",
    instructorsNote: "Daftar pengajar dibaca dari basis data. Tambahkan pengajar dari editor kursus.",
    statLearners: "Peserta terdaftar",
    statCourses: "Kelas terbit",
    statEnrollments: "Pendaftaran kelas",
    statsHiddenNote: "Angkanya dibaca langsung dari basis data dan tidak bisa diketik tangan. Akun demo tidak ikut dihitung.",
    blockTestimonials: "Testimoni Peserta",
    blockFaq: "Pertanyaan Umum",
    blockCta: "Ajakan Bertindak",
    fieldHeading: "Judul",
    fieldHighlight: "Kata sorotan",
    fieldCtaText: "Teks tombol",
    fieldCtaHref: "Tautan tombol",
    fieldSubheading: "Subjudul",
    coursesEmptyNote: "Dikosongkan berarti menampilkan empat kursus terbit terbaru.",
    testimonialsNote: "Menampilkan {n} ulasan terbaru bernilai 4 ke atas. Hanya nama depan peserta yang ditampilkan.",
    featuresNote: "{n} keunggulan. Isinya disunting di bagian Keunggulan pada halaman ini.",
    faqQuestionN: "Pertanyaan {n}",
    faqAnswerN: "Jawaban {n}",
    addFaq: "Tambah pertanyaan",
    fieldPrimaryBtn: "Tombol utama",
    fieldPrimaryHref: "Tautan tombol utama",
    fieldSecondaryBtn: "Tombol kedua",
    fieldSecondaryHref: "Tautan tombol kedua",
    landingUpdated: "Halaman depan diperbarui",
    heroSection: "Bagian Utama",
    mainHeading: "Judul utama",
    ctaButtonText: "Teks tombol ajakan",
    ctaButtonHref: "Tautan tombol ajakan",
    featuresHead: "Keunggulan",
    addFeature: "Tambah Keunggulan",
    featureN: "Keunggulan {n}",
    deleteFeatureN: "Hapus keunggulan {n}",
    iconLabel: "Ikon",
    iconGradCap: "Topi wisuda",
    iconLayers: "Lapisan",
    iconAward: "Penghargaan",
    descriptionLabel: "Deskripsi",
    featureDescAria: "Deskripsi keunggulan {n}",
    featuredCoursesHead: "Kursus Unggulan",
    featuredCoursesDesc:
      "Pilih kursus terbit yang tampil di carousel \u201CKursus Unggulan\u201D pada halaman depan publik.",
    saveFailedFillMarked: "Gagal menyimpan. Lengkapi isian yang ditandai, lalu coba lagi.",
    langTabsAria: "Bahasa konten halaman depan",
    enFallbackNote:
      "Pengunjung berbahasa Inggris melihat versi ini. Sebelum versi Inggris pernah disimpan, mereka melihat versi Indonesia.",
    idVersionNote: "Versi yang dilihat pengunjung berbahasa Indonesia (bahasa bawaan).",
    enEmptyTitle: "Versi Inggris belum ada",
    enEmptyDesc:
      "Mulai dari salinan versi Indonesia, lalu terjemahkan teksnya. Susunan dan isi kedua versi tersimpan terpisah \u2014 mengubah satu tidak mengubah yang lain.",
    copyFromId: "Mulai dari salinan versi Indonesia",
    landingSavedEn: "Versi Inggris halaman depan tersimpan",
    sectionNoun: "Bagian",
    hintHero: "Judul besar, kalimat pembuka, dan dua tombol utama di paling atas halaman.",
    hintStats: "Angka besar platform. Bawaannya dibaca dari basis data (akun demo tidak dihitung); bisa dialihkan ke isi manual.",
    hintCategories: "Kartu per bidang beserta jumlah kelasnya, menuju katalog yang sudah tersaring.",
    hintCourses: "Carousel kelas pilihan. Dikosongkan berarti menampilkan empat kelas terbit terbaru.",
    hintFeatures: "Tiga sampai empat alasan singkat kenapa belajar di sini.",
    hintSteps: "Langkah bernomor dari melihat-lihat sampai mendapat sertifikat.",
    hintInstructors: "Pengajar dengan foto. Bawaannya dari daftar instruktur di basis data; bisa dialihkan ke isi manual.",
    hintAlumni: "Kutipan alumni beserta nama, posisi, dan tempat kerjanya. Isi bawaannya hanya contoh -- ganti dengan cerita nyata, dan minta izin orangnya lebih dulu.",
    hintLogos: "Dinding atau pita logo mitra, klien, atau institusi -- gambarnya, bukan namanya. Unggah banyak logo sekaligus; angka per logo opsional. Hanya cantumkan pihak yang benar-benar bekerja sama dengan Anda.",
    blockGallery: "Galeri Foto",
    hintGallery: "Mozaik foto suasana belajar, acara, atau komunitas. Unggah banyak foto sekaligus; foto pertama tampil paling besar.",
    heroImage: "Foto hero (kolom kanan)",
    heroTrustText: "Teks kepercayaan",
    heroTrustBadges: "Lencana penilaian",
    trustBadgeLabel: "Nama situs ulasan",
    trustBadgeScore: "Nilai",
    trustBadgeLogo: "Logo situs ulasan",
    addTrustBadge: "Tambah lencana",
    deleteTrustBadgeN: "Hapus lencana {n}",
    logoVariant: "Bentuk",
    logoVariantWall: "Dinding (ubin dengan angka)",
    logoVariantStrip: "Pita (satu baris)",
    logoCaption: "Baris penutup",
    logoCount: "Angka (mis. jumlah alumni)",
    bulkUploadLabel: "Pilih atau seret banyak gambar sekaligus",
    bulkUploadHint: "PNG, JPG, atau WebP, maksimal 5MB per berkas. Satu berkas menjadi satu butir; namanya diambil dari nama berkas dan bisa diubah.",
    bulkUploadProgress: "Mengunggah {done} dari {total}",
    bulkUploadDone: "{n} gambar ditambahkan",
    bulkUploadFailed: "{n} gambar gagal diunggah",
    removeAllItems: "Hapus semua",
    alumniBefore: "Posisi sebelum",
    alumniCompanyLogo: "Logo perusahaan",
    alumniLink: "Tautan profil (opsional)",
    galleryCaption: "Keterangan foto",
    deletePhotoN: "Hapus foto {n}",
    sourceLabel: "Sumber isi",
    sourceReal: "Data real dari LMS",
    sourceManual: "Isi manual",
    sourceManualWarning: "Isi manual tidak memperbarui dirinya. Angka yang tidak pernah diperbarui akan terbaca sebagai angka karangan.",
    manualStatLabel: "Keterangan",
    manualStatValue: "Angka",
    addStat: "Tambah angka",
    deleteStatN: "Hapus angka {n}",
    manualTestimonialName: "Nama",
    manualTestimonialRating: "Bintang (1-5)",
    manualTestimonialComment: "Ulasan",
    addTestimonial: "Tambah ulasan",
    deleteTestimonialN: "Hapus ulasan {n}",
    manualInstructorName: "Nama",
    manualInstructorTitle: "Jabatan",
    manualInstructorBio: "Bio singkat",
    manualInstructorPhoto: "Foto",
    addInstructor: "Tambah pengajar",
    deleteInstructorN: "Hapus pengajar {n}",
    hintTestimonials: "Ulasan peserta. Bawaannya otomatis dari ulasan bernilai 4 ke atas (hanya nama depan); bisa dialihkan ke isi manual.",
    hintFaq: "Daftar tanya-jawab yang bisa dibuka satu per satu.",
    hintCta: "Ajakan penutup dengan dua tombol.",
    statusPublished: "Sudah terbit",
    statusDraft: "Draf belum terbit",
    undo: "Urungkan",
    redo: "Ulangi",
    discardDraft: "Buang perubahan",
    restoreDefaults: "Kembalikan bawaan",
    openInNewTab: "Tab baru",
    saveDraft: "Simpan draf",
    publish: "Terbitkan",
    builderTabsAria: "Panel pengaturan",
    tabStructure: "Susunan halaman",
    tabBlockSettings: "Pengaturan blok",
    tabTheme: "Warna",
    clickAnySection: "Klik bagian mana pun untuk menyuntingnya",
    editSectionAria: "Sunting bagian {n}",
    draftSaved: "Draf disimpan. Pengunjung belum melihatnya.",
    published: "Diterbitkan. Pengunjung sudah melihatnya.",
    draftDiscarded: "Perubahan dibuang. Kembali ke yang terbit.",
    defaultsRestored: "Isi bawaan dikembalikan. Belum diterbitkan.",
    draftNote: "Ada perubahan tersimpan yang belum diterbitkan.",
    noBlockSelected: "Belum ada bagian yang dipilih. Klik satu bagian di pratinjau.",
    confirmRestore: "Kembalikan seluruh isi ke bawaan? Suntingan Anda yang belum diterbitkan akan hilang.",
    confirmDiscard: "Buang seluruh perubahan yang belum diterbitkan?",
    seoTitle: "SEO Situs",
    seoSubtitle: "Judul dan keterangan yang muncul di hasil pencarian dan saat tautan dibagikan.",
    seoPageTitle: "Judul situs",
    seoPageDescription: "Keterangan singkat",
    seoOgImage: "Gambar saat dibagikan",
    seoOgHint: "Muncul di WhatsApp dan LinkedIn. Ukuran yang dianjurkan 1200x630.",
    seoTooLong: "{n} aksara. Di atas {max} biasanya terpotong di hasil pencarian.",
    seoEmptyFallback: "Dikosongkan berarti memakai bawaan: \u201c{teks}\u201d",
    seoPreviewHead: "Perkiraan tampilan di hasil pencarian",
    seoSaved: "Pengaturan SEO disimpan sebagai draf.",
    seoPublished: "Pengaturan SEO diterbitkan.",
    testimonialsLimit: "Jumlah ulasan ditampilkan",
    blockWhatsapp: "Tombol WhatsApp",
    hintWhatsapp: "Tombol hijau mengambang di pojok kanan bawah, membuka percakapan WhatsApp.",
    logoVariantMarquee: "Berjalan",
    waNumber: "Nomor WhatsApp",
    waLabel: "Tulisan tombol",
    waMessage: "Pesan awal (opsional)",
    waPreview: "Tautan jadinya:",
    waInvalid: "Nomornya belum lengkap, jadi tombolnya belum muncul di halaman.",
  },
  catalog: {
    navClasses: "Kelas",
    title: "Semua Kelas",
    subtitle:
      "Lihat isi kelas sebelum mendaftar: kurikulum, durasi, dan tingkatnya terbuka untuk siapa saja.",
    searchPlaceholder: "Cari kelas...",
    filterLevel: "Tingkat",
    filterCategory: "Kategori",
    allCategories: "Semua kategori",
    categoryCourses: "{n} kelas",
    categoryCoursesOne: "{n} kelas",
    allLevels: "Semua tingkat",
    levelNotSet: "Belum diisi",
    filterAccess: "Akses",
    allAccess: "Semua akses",
    accessFree: "Publik",
    accessPaid: "Berbayar",
    filterDuration: "Durasi",
    allDurations: "Semua durasi",
    durationShort: "Di bawah 1 jam",
    durationMedium: "1\u20135 jam",
    durationLong: "Di atas 5 jam",
    sortLabel: "Urutkan",
    sortNewest: "Terbaru",
    sortTitle: "Judul A\u2013Z",
    sortShortest: "Durasi tersingkat",
    sortLongest: "Durasi terpanjang",
    resultCount: "{n} kelas",
    resultCountOne: "{n} kelas",
    resultCountFiltered: "{n} dari {total} kelas",
    noResults: "Tidak ada kelas yang cocok",
    noResultsHint: "Coba ubah kata pencarian atau lepaskan salah satu saringan.",
    resetFilters: "Hapus semua saringan",
    emptyCatalog: "Belum ada kelas yang terbit",
    emptyCatalogHint: "Kelas akan muncul di sini begitu pengajar menerbitkannya.",
    viewDetail: "Lihat detail",
    learners: "{n} peserta",
    learnersOne: "{n} peserta",
    rating: "{n} dari 5 \u00B7 {c} ulasan",
    backToCatalog: "Kembali ke daftar kelas",
    aboutCourse: "Tentang kelas ini",
    whatYouGet: "Yang Anda dapatkan",
    curriculum: "Kurikulum",
    curriculumNote:
      "Judul setiap pelajaran bisa Anda lihat sekarang. Isinya terbuka setelah Anda terdaftar di kelas ini.",
    curriculumCount: "{modul} modul \u00B7 {pelajaran} pelajaran",
    curriculumCountOne: "{modul} modul \u00B7 {pelajaran} pelajaran",
    instructor: "Instruktur",
    courseFacts: "Ringkasan kelas",
    factLevel: "Tingkat",
    factCategory: "Kategori",
    factLanguage: "Bahasa",
    factDuration: "Durasi",
    factLessons: "Pelajaran",
    factCertificate: "Sertifikat",
    certificateYes: "Ada, setelah lulus",
    certificateNo: "Belum tersedia",
    benefitLifetime: "Akses tanpa batas waktu",
    benefitLifetimeDesc: "Sekali terdaftar, materinya bisa dibuka kapan saja dan diulang sesering yang Anda perlukan.",
    benefitSelfPaced: "Belajar sesuai ritme Anda",
    benefitSelfPacedDesc: "Tidak ada jadwal tetap dan tidak ada sesi yang terlewat. Anda yang menentukan kapan belajar.",
    benefitResources: "{n} sumber belajar",
    benefitResourcesOne: "{n} sumber belajar",
    benefitResourcesDesc: "Berkas dan tautan pendamping yang bisa diunduh atau dibuka selama belajar.",
    benefitQuizzes: "{n} kuis latihan",
    benefitQuizzesOne: "{n} kuis latihan",
    benefitQuizzesDesc: "Soal latihan di sepanjang kelas untuk menguji pemahaman, bukan hanya di akhir.",
    benefitCertificate: "Sertifikat kelulusan",
    benefitCertificateDesc: "Terbit otomatis setelah seluruh pelajaran selesai dan nilai kelulusan tercapai.",
    enroll: "Daftar kelas ini",
    enrollFree: "Daftar, tanpa biaya",
    loginToEnroll: "Masuk untuk mendaftar",
    loginNote: "Anda akan diminta masuk dulu, lalu kembali ke halaman ini.",
    alreadyEnrolled: "Anda sudah terdaftar di kelas ini.",
    continueLearning: "Lanjutkan belajar",
    notFoundTitle: "Kelas tidak ditemukan",
    notFoundHint: "Kelas ini mungkin sudah tidak diterbitkan, atau hanya untuk peserta yang diundang.",
    previewOnly: "Pratinjau",
    freeLabel: "Tanpa biaya",
    typeVideo: "Video",
    typeText: "Bacaan",
    typeQuiz: "Kuis",
    typeSlides: "Slide",
    nQuestions: "{n} soal",
    nQuestionsOne: "{n} soal",
    typeMixed: "Campuran",
    paidNotice: "Kelas ini berbayar dan belum bisa didaftar sendiri. Hubungi pengelola untuk didaftarkan.",
    enrollingNow: "Mendaftarkan\u2026",
    moduleLessons: "{n} pelajaran",
    moduleLessonsOne: "{n} pelajaran",
    minutes: "{n} menit",
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
    seo: "SEO",
    orgTitle: "Jabatan & Departemen",
    orgSubtitle: "Struktur perusahaan dan kursus yang berlaku untuk tiap jabatan.",
    orgDepartments: "Departemen",
    orgJobTitles: "Jabatan",
    orgAddDepartment: "Tambah departemen",
    orgAddJobTitle: "Tambah jabatan",
    orgDepartmentName: "Nama departemen",
    orgJobTitleName: "Nama jabatan",
    orgNoDepartment: "Tanpa departemen",
    orgCourses: "Kursus untuk jabatan ini",
    orgAddCourse: "Tambah kursus",
    orgRequirement: "Status",
    orgDueDays: "Tenggat (hari)",
    orgNoCourses: "Belum ada kursus untuk jabatan ini.",
    orgPeople: "Peserta",
    orgAssign: "Atur jabatan",
    orgAssignFor: "Jabatan untuk {nama}",
    orgSaved: "Tersimpan.",
    orgPurpose: "Jabatan dipakai untuk menentukan kursus wajib dan disarankan, serta laporan per departemen. Tidak dipakai untuk memeringkat orang.",
    orgSelectJobTitle: "Pilih jabatan",
    orgSelectCourse: "Pilih kursus",
    orgEmpty: "Belum ada jabatan. Tambahkan satu untuk mulai menyusun jalur kursus.",
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
    viewProfile: "Lihat profil",
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
    languageTitle: "Language",
    languageHint:
      "The LMS interface language for your account. Takes effect immediately, and is saved to your profile so it follows you across devices.",
    languageSaved: "Language saved",
    deletingBlockMessage: "Account deletion is in progress. Leave this page anyway?",
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
    forYourJob: "For your role",
    jobRequired: "Required",
    jobSuggested: "Suggested",
    jobReasonRequired: "Required for {jabatan}",
    jobReasonSuggested: "Suggested for {jabatan}",
    jobDueIn: "due {tanggal}",
    jobOverdue: "overdue since {tanggal}",
    jobStart: "Start",
    jobContinue: "Continue",
    jobEnrollNow: "Enrol",
    jobNoneYet: "No courses for your role yet.",
    noRecommendations: "No recommendations yet",
    start: "Start",
    continue: "Continue",
    learners: "Learners",
    of: "of",
    lessonsProgress: "lessons done",
  },
  courses: {
    accessPrivate: "Private",
    accessPublic: "Public",
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
    category: "Category",
    pickCategory: "Choose a category",
    noCategory: "No category",
    newCategory: "New category",
    newCategoryLabel: "Category name",
    newCategoryPh: "e.g. Programming",
    categoryCreated: "Category created and selected",
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
    tokensSupported: "Supported tokens: [Student Name], [Course Name]",
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
    lessonTypeVideo: "Video Lesson",
    lessonTypeVideoDesc: "Lesson content as a video",
    lessonTypeText: "Text Lesson",
    lessonTypeTextDesc: "Lesson content as text",
    lessonTypePpt: "Slides Lesson",
    lessonTypePptDesc: "Lesson content as a Google Slides presentation",
    lessonTypeQuiz: "Quiz Lesson",
    lessonTypeQuizDesc: "A quiz lesson to test the preceding material",
    courseLessons: "Course Lessons",
    addModule: "Add Module",
    noModules: "No modules yet. Click Add Module to start building the course.",
    unnamedModule: "Unnamed Module",
    untitledLesson: "Untitled Lesson",
    lessonN: "Lesson {n}",
    moveModuleAria:
      "Move module {judul}: press Space to pick up, arrow keys to move, Space to drop",
    moveLessonAria:
      "Move {judul}: press Space to pick up, arrow keys to move, Space to drop",
    clickToRename: "Click to rename",
    deleteModuleAttr: "Delete module",
    deleteTitled: "Delete \u201C{judul}\u201D?",
    deleteSectionDesc:
      "This module and its {n} lessons (including resources and quizzes) will be removed from the draft. Nothing is deleted from the database until you press Save.",
    toggleOpen: "Expand/collapse",
    noLessonsInModule: "No lessons in this module yet.",
    addLesson: "Add Lesson",
    complete: "Complete",
    incomplete: "Incomplete",
    nQuizIssues: "{n} quiz issues",
    nMinutes: "{n} min",
    duplicateLesson: "Duplicate lesson",
    deleteLessonAttr: "Delete lesson",
    deleteLessonDesc:
      "This lesson and all of its resources will be removed from the draft. Nothing is deleted from the database until you press Save.",
    lessonTitleLabel: "Lesson Title",
    lessonTypeHead: "Lesson Type",
    durationLabel: "Estimated Duration (minutes)",
    durationHelp: "Shown to learners. Aim for 5\u20137 minutes per lesson.",
    contentHead: "Content",
    youtubeUrl: "YouTube Video URL",
    youtubeHelp: "Paste the full YouTube link for this lesson's video",
    videoGuideTitle: "Choosing a video for this lesson",
    videoGuide1:
      "One learning goal per lesson; 5\u20137 minutes is easier to finish than one long video.",
    videoGuide2:
      "Prefer videos that are already captioned. If not, fill in the Transcript below \u2014 without either, deaf learners cannot follow this lesson.",
    videoGuide3: "State up front what learners will be able to do after watching.",
    videoGuide4: "End each module with a quiz lesson so learners recall the material.",
    transcriptLabel: "Transcript",
    transcriptPh: "Paste the full text spoken in this video.",
    transcriptHelp:
      "Required when the video has no captions. Without it, learners who are deaf or watching without sound cannot follow the lesson at all (WCAG 1.2.2). A transcript also helps learners find one part again without replaying the whole video.",
    lessonContentAria: "Lesson content",
    slidesLabel: "Google Slides Link",
    slidesHelp: "Paste a Google Slides share link or a \u201CPublish to web\u201D link",
    resourcesHead: "Resources ({n})",
    quizHead: "Quiz ({n} questions)",
    settingsHead: "Settings",
    requiredToContinue: "Required to Continue",
    comingSoon: "Coming soon. Needs a new data schema.",
    resourcesTitle: "Resources",
    resourcesDesc: "Add files, documents, or links to complement the lesson content",
    addLink: "Add Link",
    addFile: "Add File",
    fileUrl: "File URL",
    resourceTitleLabel: "Resource Title",
    fileBadge: "File",
    linkBadge: "Link",
    editNamed: "Edit {nama}",
    lessonNoun: "Lesson",
    questionNoun: "Question",
    dndStart:
      "Picked up {noun} {judul}. Use the up and down arrows to move, Space to drop, Escape to cancel.",
    dndOver: "{noun} {judul} is over {tujuan}.",
    dndNewPosition: "a new position",
    dndEndReturn: "{noun} {judul} was returned to its original position.",
    dndEnd: "{noun} {judul} was dropped at {tujuan}.",
    dndCancel: "Move cancelled. {noun} {judul} is back at its original position.",
    dndInstructions:
      "Press Space or Enter to start moving this {noun}. Then use the up and down arrows to pick a position, Space to drop, and Escape to cancel.",
    answerWritten: "Written answer",
    answerWrittenHint: "Learners type their answer in a text box.",
    answerUpload: "Upload a file or link",
    answerUploadHint: "Learners submit a link to their file (e.g. Google Drive) instead of typing.",
    noPromptsFilled: "No question has its text filled in yet",
    savedToBankSkipped: "{n} questions saved to the bank, {lewat} skipped because they are still empty",
    savedToBank: "{n} questions saved to the bank",
    noQuestions: "No questions yet. Add a question, or turn this lesson into a study case.",
    addQuestion: "Add Question",
    fromBank: "Pick from Bank",
    saveNToBank: "Save {n} questions to Bank",
    addStudyCase: "Add Study Case",
    pickTypeDesc: "Choose a question type. It cannot be changed later.",
    typeLabel: "Type",
    qtMultipleChoice: "Multiple Choice",
    qtTrueFalse: "True / False",
    qtShortAnswer: "Short Answer",
    qtEssay: "Essay",
    passScoreLabel: "Passing Score (%)",
    maxAttemptsLabel: "Max Attempts",
    unlimitedPh: "Unlimited",
    unlimited: "Unlimited",
    drawCountLabel: "Questions per Attempt",
    allN: "All ({n})",
    shuffleLabel: "Shuffle Questions",
    drawNote:
      "Each learner faces {n} random questions out of {total}. They are drawn when the attempt starts and stay the same until it ends. Because the sets differ, scores are no longer directly comparable between learners \u2014 make sure every question is of equal difficulty.",
    studyCase: "Study Case",
    normalQuiz: "Normal Quiz",
    assessmentNote:
      "No start button or time limit; learners save a draft and submit when done. Grade it manually in Admin \u203A Grading. It weighs {w}\u00D7 a normal quiz in the final course grade.",
    normalQuizNote: "Auto-graded with an immediate score on submit.",
    changeModeNote: "To switch modes, first delete every question in this quiz.",
    moveQuestionAria: "Move question {n}: press Space to pick up, arrow keys to move, Space to drop",
    questionN: "Question {n}",
    nPoints: "{n} points",
    deleteQuestionAria: "Delete question {n}",
    toggleQuestionAria: "Expand/collapse question {n}",
    promptLabel: "Question",
    promptAria: "Question {n} prompt",
    allowMultiple: "Allow more than one correct answer",
    caseSensitive: "Case sensitive",
    needAcceptedAnswer: "Add at least one accepted answer. A normal quiz must be auto-gradable.",
    explanationLabel: "Explanation (optional)",
    explanationHelp:
      "Shown to learners after they submit: why that answer is correct, and what to review if they got it wrong. One or two simple sentences is enough.",
    explanationPh: "e.g. Recalling is more effective than rereading. Review lesson 2.",
    answerFormat: "Answer format",
    notAutoGraded: "Answers of this type are not auto-graded.",
    correctAnswer: "Correct Answer",
    acceptedAnswers: "Accepted Answers",
    choices: "Choices",
    addAnswer: "Add Answer",
    addChoice: "Add Choice",
    markCorrect: "Mark as the correct answer",
    acceptedAnswerAria: "Accepted answer",
    choiceTextAria: "Choice text",
    removeChoice: "Remove choice",
    rtSizeSmall: "Small",
    rtSizeNormal: "Normal",
    rtSizeLarge: "Large",
    rtSizeLarger: "Larger",
    rtParagraph: "Paragraph",
    rtHeadingN: "Heading {n}",
    rtAltPrompt:
      "Describe this image for learners who cannot see it (what it shows and why it matters).\nLeave empty if the image is decorative.",
    rtEditorAria: "Content editor",
    rtTextSize: "Text size",
    rtTextColor: "Text colour",
    rtHighlight: "Highlight",
    rtBold: "Bold",
    rtItalic: "Italic",
    rtUnderline: "Underline",
    rtStrike: "Strikethrough",
    rtUploadingImage: "Uploading image\u2026",
    rtInsertImage: "Insert image",
    rtQuote: "Quote",
    rtCodeBlock: "Code block",
    rtInsertTable: "Insert table",
    rtTable: "Table",
    rtAddRowBelow: "Add row below",
    rtAddColRight: "Add column right",
    rtDeleteRow: "Delete row",
    rtDeleteCol: "Delete column",
    rtDeleteTable: "Delete table",
    rtAlign: "Text alignment",
    rtAlignLeft: "Left",
    rtAlignCenter: "Centre",
    rtAlignRight: "Right",
    rtBulletList: "Bulleted list",
    rtOrderedList: "Numbered list",
    guideWordCount: "{kata} words \u00B7 about {menit} min read",
    guideTooLong:
      "Over 10 minutes: consider splitting it into two lessons with one goal each.",
    guideTarget: "Aim for 5\u20137 minutes and one learning goal per lesson.",
    guideUseDuration: "Use {n} minutes as the duration",
    guideTip1: "Start with one sentence about what learners will be able to do.",
    guideTip2: "Use subheadings and short paragraphs: most readers scan before reading.",
    guideTip3: "Explain every technical term the first time it appears.",
    guideTip4: "Give an example from real work before the rule.",
    guideTip5: "End with a short exercise (a quiz lesson) so learners recall what they read.",
    blankCourse: "Blank course",
    blankCourseDesc: "Fill it in yourself from scratch",
    importMd: "Import from a .md file",
    importMdDesc: "Output from your AI assistant",
    creatingCourse: "Creating\u2026",
    courseDeleted: "Course deleted",
    deleteCourseAria: "Delete course",
    deleteCourseDesc:
      "The course and all of its modules, lessons, and resources will be permanently deleted. This cannot be undone.",
    movingToDraft: "Unpublishing\u2026",
    publishing: "Publishing\u2026",
    publishedBadge: "Published",
    draftBadge: "Draft",
    movedToDraft: "Moved to draft",
    publishedShort: "Published",
    publishedClickDraft: "Published. Click to move to draft",
    draftClickPublish: "Draft. Click to publish",
    moveToDraftTitle: "Move \u201C{judul}\u201D to draft?",
    moveToDraftDesc:
      "The course will disappear from the catalogue and enrolled learners can no longer open it. Their progress is kept, and you can republish any time.",
    moveToDraft: "Move to draft",
    previewCourse: "Preview course",
    editCourseAria: "Edit course",
    noCourses: "No courses yet. Click Create Course to add your first course.",
    noCourseFilterMatches: "No course matches your filters.",
    mdPickFile: "Choose a .md file",
    mdFileRead: "File read. Review the result, then save.",
    mdImportExport: "Import / export",
    mdTitle: "Build the course with AI help",
    mdDesc:
      "Sanggabiz does not call any AI. You use the AI assistant you already have, then import the result here.",
    mdStep1: "Download the writing guide",
    mdStep1Desc: "Contains the file format and the rules for writing good lessons.",
    mdStep2: "Take it to your AI assistant",
    mdStep2Desc1: "Open ChatGPT, Claude, or another. Give it the guide along with your material and SOPs, then ask for one",
    mdStep2Desc2: "file as the output.",
    mdStep3: "Upload the result",
    mdReading: "Reading\u2026",
    mdPickFileBtn: "Choose a .md file",
    mdLockedByLearners:
      "This course already has {n} enrollments, so its content cannot be replaced by import. The export below still works.",
    mdReport: "Read: {modul} modules, {pelajaran} lessons, {soal} questions",
    mdWarningsIntro: "Some parts were skipped or fixed automatically:",
    mdNoWarnings: "Nothing was missed.",
    mdResultNote: "The result is now in the editor as a draft. Review it first, then press Save.",
    mdExportThis: "Export this course",
    bankNonePicked: "No question selected yet",
    bankCopied: "{n} questions copied from the bank",
    bankTitle: "Pick from the Question Bank",
    bankCopyNote1: "Selected questions are",
    bankCopyNote2: "into this quiz. Editing them here does not change the bank.",
    bankNotReadyPrefix: "The question bank is not active yet: the table",
    bankSearchPh: "Search question text or tags\u2026",
    bankSearchAria: "Search questions in the bank",
    loadingShort: "Loading\u2026",
    bankEmpty: "No questions in the bank yet. Save questions to the bank from the quiz editor first.",
    bankCount: "{n} questions, {dipilih} selected",
    bankPickAria: "Select question: {soal}",
    bankCopyToQuiz: "Copy to Quiz",
    bankCopiedWord: "copied",
  },
  courseDetail: {
    summary: "Course Summary",
    contents: "Course contents",
    whoFor: "Who This Course Is For",
    requirements: "Requirements",
    instructorRole: "Course Instructor",
    reviews: "Reviews",
    backToCourses: "Back to course list",
    backToEditor: "Back to course editor",
    nResources: "{n} learning resources",
    nEnrolled: "{n} learners enrolled",
    courseGrade: "Course Grade",
    pendingGradeNote: "{n} study cases await instructor grading. The grade can still go up.",
    notesPrivate: "Only you can see these notes.",
    notesEmpty:
      "You have not written any notes in this course. Write notes under the lesson material and they will appear here.",
    notesUpdated: "Updated {waktu}",
    openLessonLink: "Open lesson",
    needEnrollTitle: "Enrollment needed",
    needEnrollDesc: "You need to join this course before you can start learning.",
    enrolledToastOk: "You are enrolled. Happy learning.",
    enrollPending: "Enrolling\u2026",
  },
  superadmin: {
    mentorTitle: "Mentors",
    seeMentorEvaluation: "See mentor evaluation",
    mentorSummary: "{mentor} mentors manage {kursus} published courses for {peserta} learners.",
    mentorPendingSuffix: "{n} essays await grading.",
    mentorSubtitle: "Each mentor's performance side by side. These numbers are to help them, not to rank them.",
    mentorStat: "Mentors",
    publishedCourses: "Published Courses",
    learnersReached: "Learners Reached",
    essaysPending: "Essays Awaiting Grading",
    noBacklog: "No backlog",
    learnersWaiting: "Learners are waiting",
    noMentors: "No mentors yet",
    noMentorsHint:
      "Someone becomes a mentor when their role is changed to mentor. They can then build and manage their own courses.",
    scrollMentors: "Mentor performance, scrolls horizontally",
    colMentor: "Mentor",
    colCompletion: "Completion",
    colReviews: "Reviews",
    colPendingGrade: "Awaiting grading",
    nPublished: "{n} published",
    ofNCourses: "of {n} courses",
    nEnrollments: "{n} enrollments",
    noEnrollmentsYet: "no enrollments yet",
    completedOf: "{selesai} of {total}",
    noReviewsYet: "no reviews yet",
    nReviews: "{n} reviews",
    avgAllMentors: "Average rating across all mentors: {nilai} from {n} reviews.",
    certDefaultsSaved: "Certificate settings saved",
    certDefaultsTitle: "Certificates",
    certDefaultsSubtitle:
      "Used by every course that does not set its own certificate. A partner course only fills in the fields that actually differ; everything else keeps following this page.",
    certDefaultsNotReady1: "The table",
    certDefaultsNotReady2: "does not exist in the database yet, so this page cannot be saved. Run",
    certDefaultsNotReady3:
      "in the Supabase SQL Editor first. Until then, certificates are still issued using each course's own settings as before.",
    signatureImage: "Signature Image",
    savePrefs: "Save Settings",
    colorsSaved: "Colours saved",
    landingColors: "Landing Page Colours",
    landingColorsDesc: "Only affects the landing page. Learning and admin screens keep the default palette.",
    primaryColor: "Primary colour",
    softSurface: "Soft surface",
    textColor: "Text colour",
    colorPickerAria: "{label} (colour picker)",
    contrastTextOnSurface: "Text on surface",
    contrastWhiteOnButton: "White text on button",
    contrastPrimaryOnWhite: "Primary on white",
    contrastPass: "passes",
    contrastMin: "minimum 4.5:1",
    saveColors: "Save Colours",
    featuredCoursesAria: "Featured courses",
    previewHead: "Preview",
    livePreviewNote: "Updates as you type. Nothing is saved until you press Save.",
    editThisSection: "Edit this section",
    duplicateBlock: "Duplicate {nama}",
    addSectionTitle: "Add a section",
    addSectionHint: "Choose the section you want to add to the landing page.",
    dragHandleBlock: "Move {nama}: press Space to pick up, arrow keys to move, Space to drop",
    deviceWidth: "Device width",
    deviceDesktop: "Desktop",
    deviceTablet: "Tablet",
    devicePhone: "Phone",
    reload: "Reload",
    previewSavedNote: "Shows the saved landing page. Unsaved changes are not visible here yet.",
    landingPreviewTitle: "Landing page preview",
    certPreviewFailed: "Could not create the preview",
    certPreviewHead: "Preview",
    certPreviewDesc: "A sample result with placeholder learner data. Rendered with the same document as actually issued certificates.",
    updating: "Updating\u2026",
    openNewTab: "Open in a new tab",
    certPreviewTitle: "Certificate preview",
    certPreviewUnavailable: "Preview unavailable",
    certPreviewPreparing: "Preparing the preview\u2026",
    certPreviewBlankHint: "Blank frame? Your browser may not display PDFs inline \u2014 use \u201COpen in a new tab\u201D to see it.",
    landingSaved: "Landing page saved",
    landingTitle: "Landing Page",
    landingSubtitle: "Arrange the landing page sections: add, hide, delete, and reorder.",
    addSection: "Add Section",
    hiddenBadge: "Hidden",
    moveUp: "Move {nama} up",
    moveDown: "Move {nama} down",
    showBlock: "Show {nama}",
    hideBlock: "Hide {nama}",
    noBlocks: "No sections yet. Add at least one before saving.",
    blockHero: "Hero",
    blockCourses: "Featured Courses",
    blockFeatures: "Highlights",
    blockStats: "Platform Numbers",
    blockCategories: "Browse by Field",
    blockSteps: "How to Start",
    blockLogos: "Partner Logos",
    blockInstructors: "Instructors",
    blockAlumni: "Alumni Stories",
    alumniName: "Name",
    alumniRole: "Role",
    alumniCompany: "Company or institution",
    alumniQuote: "Quote",
    alumniPhoto: "Photo",
    addAlumni: "Add alumni story",
    deleteAlumniN: "Delete alumni story {n}",
    alumniNote: "Use quotes that were actually collected for publication, with the person's permission. This section names people and where they work.",
    stepN: "Step {n}",
    addStep: "Add step",
    deleteStepN: "Delete step {n}",
    logoName: "Partner name",
    logoImage: "Logo",
    addLogo: "Add partner",
    deleteLogoN: "Delete partner {n}",
    logoNameRequired: "The partner name is required; the logo is optional.",
    categoriesNote: "Categories and their class counts are read from the database. Empty ones are not shown.",
    instructorsNote: "The instructor list is read from the database. Add instructors from the course editor.",
    statLearners: "Registered learners",
    statCourses: "Published classes",
    statEnrollments: "Class enrolments",
    statsHiddenNote: "The numbers are read straight from the database and cannot be typed in. Demo accounts are left out.",
    blockTestimonials: "Learner Testimonials",
    blockFaq: "FAQ",
    blockCta: "Call to Action",
    fieldHeading: "Heading",
    fieldHighlight: "Highlighted word",
    fieldCtaText: "Button text",
    fieldCtaHref: "Button link",
    fieldSubheading: "Subheading",
    coursesEmptyNote: "Leaving it empty shows the four most recent published courses.",
    testimonialsNote: "Shows the {n} most recent reviews rated 4 or higher. Only learners' first names are shown.",
    featuresNote: "{n} highlights. Their content is edited in the Highlights section on this page.",
    faqQuestionN: "Question {n}",
    faqAnswerN: "Answer {n}",
    addFaq: "Add question",
    fieldPrimaryBtn: "Primary button",
    fieldPrimaryHref: "Primary button link",
    fieldSecondaryBtn: "Secondary button",
    fieldSecondaryHref: "Secondary button link",
    landingUpdated: "Landing page updated",
    heroSection: "Hero Section",
    mainHeading: "Main heading",
    ctaButtonText: "Call-to-action button text",
    ctaButtonHref: "Call-to-action button link",
    featuresHead: "Highlights",
    addFeature: "Add Highlight",
    featureN: "Highlight {n}",
    deleteFeatureN: "Delete highlight {n}",
    iconLabel: "Icon",
    iconGradCap: "Graduation cap",
    iconLayers: "Layers",
    iconAward: "Award",
    descriptionLabel: "Description",
    featureDescAria: "Highlight {n} description",
    featuredCoursesHead: "Featured Courses",
    featuredCoursesDesc:
      "Choose the published courses shown in the \u201CFeatured Courses\u201D carousel on the public landing page.",
    saveFailedFillMarked: "Could not save. Complete the marked fields, then try again.",
    langTabsAria: "Landing page content language",
    enFallbackNote:
      "English-speaking visitors see this version. Until an English version has been saved, they see the Indonesian one.",
    idVersionNote: "The version Indonesian-speaking visitors see (the default language).",
    enEmptyTitle: "No English version yet",
    enEmptyDesc:
      "Start from a copy of the Indonesian version, then translate the text. The two versions are stored separately \u2014 changing one does not change the other.",
    copyFromId: "Start from a copy of the Indonesian version",
    landingSavedEn: "English landing page saved",
    sectionNoun: "Section",
    hintHero: "The big headline, opening sentence, and two main buttons at the very top.",
    hintStats: "A band of platform numbers. Read from the database; demo accounts are excluded.",
    hintCategories: "A card per field with its class count, linking to a pre-filtered catalogue.",
    hintCourses: "Featured class carousel. Leaving it empty shows the four most recent published classes.",
    hintFeatures: "Three or four short reasons to learn here.",
    hintSteps: "Numbered steps from browsing to earning a certificate.",
    hintInstructors: "Instructor cards, read from the instructor list in the database.",
    hintAlumni: "Alumni quotes with their name, role, and where they work. The default entries are examples -- replace them with real stories, and ask the person first.",
    hintLogos: "A wall or strip of partner, client, or institution logos -- the images, not the names. Upload many at once; a number per logo is optional. Only list organisations you actually work with.",
    blockGallery: "Photo Gallery",
    hintGallery: "A mosaic of photos from classes, events, or the community. Upload many at once; the first photo shows largest.",
    heroImage: "Hero photo (right column)",
    heroTrustText: "Trust line",
    heroTrustBadges: "Rating badges",
    trustBadgeLabel: "Review site name",
    trustBadgeScore: "Score",
    trustBadgeLogo: "Review site logo",
    addTrustBadge: "Add badge",
    deleteTrustBadgeN: "Delete badge {n}",
    logoVariant: "Shape",
    logoVariantWall: "Wall (tiles with numbers)",
    logoVariantStrip: "Strip (one row)",
    logoCaption: "Closing line",
    logoCount: "Number (e.g. alumni count)",
    bulkUploadLabel: "Choose or drop many images at once",
    bulkUploadHint: "PNG, JPG, or WebP, up to 5MB each. One file becomes one item; its name comes from the file name and can be edited.",
    bulkUploadProgress: "Uploading {done} of {total}",
    bulkUploadDone: "{n} images added",
    bulkUploadFailed: "{n} images failed to upload",
    removeAllItems: "Remove all",
    alumniBefore: "Role before",
    alumniCompanyLogo: "Company logo",
    alumniLink: "Profile link (optional)",
    galleryCaption: "Photo caption",
    deletePhotoN: "Delete photo {n}",
    sourceLabel: "Content source",
    sourceReal: "Live data from the LMS",
    sourceManual: "Manual entry",
    sourceManualWarning: "Manual content does not update itself. A number that is never updated reads as a made-up number.",
    manualStatLabel: "Label",
    manualStatValue: "Number",
    addStat: "Add number",
    deleteStatN: "Delete number {n}",
    manualTestimonialName: "Name",
    manualTestimonialRating: "Stars (1-5)",
    manualTestimonialComment: "Review",
    addTestimonial: "Add review",
    deleteTestimonialN: "Delete review {n}",
    manualInstructorName: "Name",
    manualInstructorTitle: "Title",
    manualInstructorBio: "Short bio",
    manualInstructorPhoto: "Photo",
    addInstructor: "Add instructor",
    deleteInstructorN: "Delete instructor {n}",
    hintTestimonials: "Learner reviews rated 4 or higher, pulled automatically. Only first names are shown.",
    hintFaq: "A list of questions and answers that open one at a time.",
    hintCta: "A closing call to action with two buttons.",
    statusPublished: "Published",
    statusDraft: "Unpublished draft",
    undo: "Undo",
    redo: "Redo",
    discardDraft: "Discard changes",
    restoreDefaults: "Restore defaults",
    openInNewTab: "New tab",
    saveDraft: "Save draft",
    publish: "Publish",
    builderTabsAria: "Settings panels",
    tabStructure: "Page structure",
    tabBlockSettings: "Section settings",
    tabTheme: "Colours",
    clickAnySection: "Click any section to edit it",
    editSectionAria: "Edit the {n} section",
    draftSaved: "Draft saved. Visitors cannot see it yet.",
    published: "Published. Visitors can see it now.",
    draftDiscarded: "Changes discarded. Back to what is published.",
    defaultsRestored: "Default content restored. Not published yet.",
    draftNote: "There are saved changes that have not been published.",
    noBlockSelected: "No section selected yet. Click one in the preview.",
    confirmRestore: "Restore all content to the defaults? Your unpublished edits will be lost.",
    confirmDiscard: "Discard every unpublished change?",
    seoTitle: "Site SEO",
    seoSubtitle: "The title and description shown in search results and when a link is shared.",
    seoPageTitle: "Site title",
    seoPageDescription: "Short description",
    seoOgImage: "Image when shared",
    seoOgHint: "Shown on WhatsApp and LinkedIn. 1200x630 is the recommended size.",
    seoTooLong: "{n} characters. Above {max} it is usually cut off in search results.",
    seoEmptyFallback: "Leaving it empty uses the default: \u201c{teks}\u201d",
    seoPreviewHead: "How it will roughly look in search results",
    seoSaved: "SEO settings saved as a draft.",
    seoPublished: "SEO settings published.",
    testimonialsLimit: "Reviews shown",
    blockWhatsapp: "WhatsApp Button",
    hintWhatsapp: "A green button floating at the bottom right that opens a WhatsApp chat.",
    logoVariantMarquee: "Scrolling",
    waNumber: "WhatsApp number",
    waLabel: "Button text",
    waMessage: "Opening message (optional)",
    waPreview: "Resulting link:",
    waInvalid: "The number is incomplete, so the button is not shown on the page yet.",
  },
  catalog: {
    navClasses: "Classes",
    title: "All Classes",
    subtitle:
      "See what is inside a class before enrolling: its curriculum, duration, and level are open to everyone.",
    searchPlaceholder: "Search classes...",
    filterLevel: "Level",
    filterCategory: "Category",
    allCategories: "All categories",
    categoryCourses: "{n} classes",
    categoryCoursesOne: "{n} class",
    allLevels: "All levels",
    levelNotSet: "Not set",
    filterAccess: "Access",
    allAccess: "All access",
    accessFree: "Public",
    accessPaid: "Paid",
    filterDuration: "Duration",
    allDurations: "All durations",
    durationShort: "Under 1 hour",
    durationMedium: "1\u20135 hours",
    durationLong: "Over 5 hours",
    sortLabel: "Sort",
    sortNewest: "Newest",
    sortTitle: "Title A\u2013Z",
    sortShortest: "Shortest first",
    sortLongest: "Longest first",
    resultCount: "{n} classes",
    resultCountOne: "{n} class",
    resultCountFiltered: "{n} of {total} classes",
    noResults: "No class matches",
    noResultsHint: "Try different search words, or drop one of the filters.",
    resetFilters: "Clear all filters",
    emptyCatalog: "No published classes yet",
    emptyCatalogHint: "Classes appear here as soon as an instructor publishes one.",
    viewDetail: "View details",
    learners: "{n} learners",
    learnersOne: "{n} learner",
    rating: "{n} out of 5 \u00B7 {c} reviews",
    backToCatalog: "Back to the class list",
    aboutCourse: "About this class",
    whatYouGet: "What you get",
    curriculum: "Curriculum",
    curriculumNote:
      "You can see every lesson title right now. The content opens once you are enrolled in this class.",
    curriculumCount: "{modul} modules \u00B7 {pelajaran} lessons",
    curriculumCountOne: "{modul} module \u00B7 {pelajaran} lessons",
    instructor: "Instructor",
    courseFacts: "Class summary",
    factLevel: "Level",
    factCategory: "Category",
    factLanguage: "Language",
    factDuration: "Duration",
    factLessons: "Lessons",
    factCertificate: "Certificate",
    certificateYes: "Yes, on passing",
    certificateNo: "Not available yet",
    benefitLifetime: "Access with no time limit",
    benefitLifetimeDesc: "Once enrolled, the material stays open and you can revisit it as often as you need.",
    benefitSelfPaced: "Learn at your own pace",
    benefitSelfPacedDesc: "No fixed schedule and no session to miss. You decide when to study.",
    benefitResources: "{n} learning resources",
    benefitResourcesOne: "{n} learning resource",
    benefitResourcesDesc: "Companion files and links you can download or open while studying.",
    benefitQuizzes: "{n} practice quizzes",
    benefitQuizzesOne: "{n} practice quiz",
    benefitQuizzesDesc: "Practice questions throughout the class to test your understanding, not only at the end.",
    benefitCertificate: "Certificate of completion",
    benefitCertificateDesc: "Issued automatically once every lesson is done and the passing grade is reached.",
    enroll: "Enrol in this class",
    enrollFree: "Enrol, free of charge",
    loginToEnroll: "Sign in to enrol",
    loginNote: "You will be asked to sign in first, then brought back to this page.",
    alreadyEnrolled: "You are already enrolled in this class.",
    continueLearning: "Continue learning",
    notFoundTitle: "Class not found",
    notFoundHint: "This class may no longer be published, or it is only for invited learners.",
    previewOnly: "Preview",
    freeLabel: "Free of charge",
    typeVideo: "Video",
    typeText: "Reading",
    typeQuiz: "Quiz",
    typeSlides: "Slides",
    nQuestions: "{n} questions",
    nQuestionsOne: "{n} question",
    typeMixed: "Mixed",
    paidNotice: "This class is paid and cannot be self-enrolled yet. Contact the organiser to be enrolled.",
    enrollingNow: "Enrolling\u2026",
    moduleLessons: "{n} lessons",
    moduleLessonsOne: "{n} lesson",
    minutes: "{n} min",
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
    seo: "SEO",
    orgTitle: "Roles & Departments",
    orgSubtitle: "The company structure and which courses apply to each role.",
    orgDepartments: "Departments",
    orgJobTitles: "Roles",
    orgAddDepartment: "Add department",
    orgAddJobTitle: "Add role",
    orgDepartmentName: "Department name",
    orgJobTitleName: "Role name",
    orgNoDepartment: "No department",
    orgCourses: "Courses for this role",
    orgAddCourse: "Add course",
    orgRequirement: "Status",
    orgDueDays: "Due (days)",
    orgNoCourses: "No courses for this role yet.",
    orgPeople: "Learners",
    orgAssign: "Set role",
    orgAssignFor: "Role for {nama}",
    orgSaved: "Saved.",
    orgPurpose: "Roles decide which courses are required or suggested, and group the per-department report. They are never used to rank people.",
    orgSelectJobTitle: "Choose a role",
    orgSelectCourse: "Choose a course",
    orgEmpty: "No roles yet. Add one to start building a course path.",
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
    viewProfile: "View profile",
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

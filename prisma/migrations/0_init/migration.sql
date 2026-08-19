-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'sinh_vien',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "maSV" TEXT NOT NULL,
    "hoLot" TEXT,
    "ten" TEXT,
    "hoTen" TEXT,
    "gioiTinh" TEXT,
    "ngaySinh" TEXT,
    "maLop" TEXT,
    "trangThai" TEXT DEFAULT 'DANG_HOC',
    "soDienThoai" TEXT,
    "ghiChu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBatch" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester" TEXT,
    "academicYear" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRecord" (
    "id" SERIAL NOT NULL,
    "maSV" TEXT NOT NULL,
    "batchCode" TEXT,
    "nhomThi" TEXT,
    "mapThi" TEXT,
    "maMH" TEXT,
    "tenMH" TEXT,
    "maHTThi" TEXT,
    "nhomHoc" TEXT,
    "toThi" TEXT,
    "maLopMH" TEXT,
    "ngayThi" TEXT,
    "gioThi" TEXT,
    "soPhutThi" TEXT,
    "maDotThi" TEXT,
    "tenDotThi" TEXT,
    "isPostponed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "id" SERIAL NOT NULL,
    "classCode" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "totalCourses" INTEGER DEFAULT 0,
    "totalCredits" INTEGER DEFAULT 0,
    "tuitionFee" INTEGER DEFAULT 0,
    "lastPulledAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMeta" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAccount" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "systemKey" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "systemUrl" TEXT NOT NULL,
    "extUsername" TEXT NOT NULL,
    "extPassword" TEXT NOT NULL,
    "token" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "syncMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "username" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramConfig" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "botToken" TEXT,
    "chatId" TEXT NOT NULL,
    "threadId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyExamSchedule" BOOLEAN NOT NULL DEFAULT true,
    "notifyClassActivity" BOOLEAN NOT NULL DEFAULT true,
    "notifyQldtAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "qldtCheckInterval" INTEGER NOT NULL DEFAULT 2,
    "lastQldtCheckedAt" TIMESTAMP(3),
    "notifyClassSchedule" BOOLEAN NOT NULL DEFAULT true,
    "classReminderBefore" INTEGER NOT NULL DEFAULT 30,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestError" TEXT,
    "botUsername" TEXT,
    "botFirstName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamReminderLog" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "examRecordId" INTEGER NOT NULL,
    "reminderType" TEXT NOT NULL,
    "targetDate" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QldtAnnouncementLog" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "title" TEXT,
    "publishDate" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QldtAnnouncementLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassScheduleReminderLog" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "targetDate" TEXT NOT NULL,
    "sessionInfo" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassScheduleReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "lop" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Student_maSV_key" ON "Student"("maSV");

-- CreateIndex
CREATE INDEX "Student_maSV_idx" ON "Student"("maSV");

-- CreateIndex
CREATE INDEX "Student_maLop_idx" ON "Student"("maLop");

-- CreateIndex
CREATE INDEX "Student_trangThai_idx" ON "Student"("trangThai");

-- CreateIndex
CREATE INDEX "Student_ten_idx" ON "Student"("ten");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBatch_code_key" ON "ExamBatch"("code");

-- CreateIndex
CREATE INDEX "ExamBatch_code_idx" ON "ExamBatch"("code");

-- CreateIndex
CREATE INDEX "ExamBatch_isActive_idx" ON "ExamBatch"("isActive");

-- CreateIndex
CREATE INDEX "ExamRecord_maSV_idx" ON "ExamRecord"("maSV");

-- CreateIndex
CREATE INDEX "ExamRecord_batchCode_idx" ON "ExamRecord"("batchCode");

-- CreateIndex
CREATE INDEX "ExamRecord_maMH_idx" ON "ExamRecord"("maMH");

-- CreateIndex
CREATE INDEX "ExamRecord_ngayThi_idx" ON "ExamRecord"("ngayThi");

-- CreateIndex
CREATE INDEX "ExamRecord_mapThi_idx" ON "ExamRecord"("mapThi");

-- CreateIndex
CREATE INDEX "ExamRecord_isPostponed_idx" ON "ExamRecord"("isPostponed");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRegistration_classCode_username_key" ON "CourseRegistration"("classCode", "username");

-- CreateIndex
CREATE INDEX "CourseRegistration_classCode_idx" ON "CourseRegistration"("classCode");

-- CreateIndex
CREATE INDEX "CourseRegistration_username_idx" ON "CourseRegistration"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SystemMeta_key_key" ON "SystemMeta"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAccount_username_systemKey_key" ON "ExternalAccount"("username", "systemKey");

-- CreateIndex
CREATE INDEX "ExternalAccount_username_idx" ON "ExternalAccount"("username");

-- CreateIndex
CREATE INDEX "ExternalAccount_systemKey_idx" ON "ExternalAccount"("systemKey");

-- CreateIndex
CREATE INDEX "ActivityLog_username_idx" ON "ActivityLog"("username");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_targetType_idx" ON "ActivityLog"("targetType");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConfig_username_key" ON "TelegramConfig"("username");

-- CreateIndex
CREATE INDEX "TelegramConfig_username_idx" ON "TelegramConfig"("username");

-- CreateIndex
CREATE INDEX "TelegramConfig_isEnabled_idx" ON "TelegramConfig"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalConfig_key_key" ON "GlobalConfig"("key");

-- CreateIndex
CREATE INDEX "GlobalConfig_key_idx" ON "GlobalConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ExamReminderLog_username_examRecordId_reminderType_key" ON "ExamReminderLog"("username", "examRecordId", "reminderType");

-- CreateIndex
CREATE INDEX "ExamReminderLog_username_idx" ON "ExamReminderLog"("username");

-- CreateIndex
CREATE INDEX "ExamReminderLog_targetDate_idx" ON "ExamReminderLog"("targetDate");

-- CreateIndex
CREATE INDEX "ExamReminderLog_reminderType_idx" ON "ExamReminderLog"("reminderType");

-- CreateIndex
CREATE UNIQUE INDEX "QldtAnnouncementLog_username_announcementId_key" ON "QldtAnnouncementLog"("username", "announcementId");

-- CreateIndex
CREATE INDEX "QldtAnnouncementLog_username_idx" ON "QldtAnnouncementLog"("username");

-- CreateIndex
CREATE INDEX "QldtAnnouncementLog_announcementId_idx" ON "QldtAnnouncementLog"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassScheduleReminderLog_username_courseCode_reminderType_targetDate_key" ON "ClassScheduleReminderLog"("username", "courseCode", "reminderType", "targetDate");

-- CreateIndex
CREATE INDEX "ClassScheduleReminderLog_username_idx" ON "ClassScheduleReminderLog"("username");

-- CreateIndex
CREATE INDEX "ClassScheduleReminderLog_targetDate_idx" ON "ClassScheduleReminderLog"("targetDate");

-- CreateIndex
CREATE INDEX "ClassScheduleReminderLog_reminderType_idx" ON "ClassScheduleReminderLog"("reminderType");

-- CreateIndex
CREATE INDEX "RegistrationRequest_username_idx" ON "RegistrationRequest"("username");

-- CreateIndex
CREATE INDEX "RegistrationRequest_status_idx" ON "RegistrationRequest"("status");

-- CreateIndex
CREATE INDEX "RegistrationRequest_createdAt_idx" ON "RegistrationRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_username_fkey" FOREIGN KEY ("username") REFERENCES "Student"("maSV") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRecord" ADD CONSTRAINT "ExamRecord_maSV_fkey" FOREIGN KEY ("maSV") REFERENCES "Student"("maSV") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRecord" ADD CONSTRAINT "ExamRecord_batchCode_fkey" FOREIGN KEY ("batchCode") REFERENCES "ExamBatch"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramConfig" ADD CONSTRAINT "TelegramConfig_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

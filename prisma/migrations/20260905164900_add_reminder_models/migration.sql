-- CreateTable
CREATE TABLE "ReminderItem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "idToHoc" TEXT,
    "idMon" TEXT,
    "maMon" TEXT,
    "tenMon" TEXT,
    "nhomTo" TEXT,
    "lop" TEXT,
    "tkbRaw" TEXT,
    "giangVien" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "creatorUsername" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderAlert" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "offsetMinutes" INTEGER NOT NULL,
    "label" TEXT,
    "triggerTime" TIMESTAMP(3) NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderParticipant" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderNotificationLog" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "alertId" INTEGER,
    "username" TEXT NOT NULL,
    "offsetMinutes" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,

    CONSTRAINT "ReminderNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderItem_creatorUsername_idx" ON "ReminderItem"("creatorUsername");
CREATE INDEX "ReminderItem_type_idx" ON "ReminderItem"("type");
CREATE INDEX "ReminderItem_idToHoc_idx" ON "ReminderItem"("idToHoc");
CREATE INDEX "ReminderItem_maMon_idx" ON "ReminderItem"("maMon");
CREATE INDEX "ReminderItem_nhomTo_idx" ON "ReminderItem"("nhomTo");
CREATE INDEX "ReminderItem_lop_idx" ON "ReminderItem"("lop");
CREATE INDEX "ReminderItem_eventTime_idx" ON "ReminderItem"("eventTime");
CREATE INDEX "ReminderItem_status_idx" ON "ReminderItem"("status");

-- CreateIndex
CREATE INDEX "ReminderAlert_reminderId_idx" ON "ReminderAlert"("reminderId");
CREATE INDEX "ReminderAlert_triggerTime_idx" ON "ReminderAlert"("triggerTime");
CREATE INDEX "ReminderAlert_isSent_idx" ON "ReminderAlert"("isSent");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderParticipant_reminderId_username_key" ON "ReminderParticipant"("reminderId", "username");
CREATE INDEX "ReminderParticipant_username_idx" ON "ReminderParticipant"("username");
CREATE INDEX "ReminderParticipant_reminderId_idx" ON "ReminderParticipant"("reminderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderNotificationLog_reminderId_offsetMinutes_username_key" ON "ReminderNotificationLog"("reminderId", "offsetMinutes", "username");
CREATE INDEX "ReminderNotificationLog_username_idx" ON "ReminderNotificationLog"("username");
CREATE INDEX "ReminderNotificationLog_reminderId_idx" ON "ReminderNotificationLog"("reminderId");
CREATE INDEX "ReminderNotificationLog_offsetMinutes_idx" ON "ReminderNotificationLog"("offsetMinutes");

-- AddForeignKey
ALTER TABLE "ReminderItem" ADD CONSTRAINT "ReminderItem_creatorUsername_fkey" FOREIGN KEY ("creatorUsername") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderAlert" ADD CONSTRAINT "ReminderAlert_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "ReminderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderParticipant" ADD CONSTRAINT "ReminderParticipant_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "ReminderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderParticipant" ADD CONSTRAINT "ReminderParticipant_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderNotificationLog" ADD CONSTRAINT "ReminderNotificationLog_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "ReminderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

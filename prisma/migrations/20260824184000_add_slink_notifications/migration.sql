-- AlterTable
ALTER TABLE "TelegramConfig" ADD COLUMN IF NOT EXISTS "notifySlinkAnnouncements" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TelegramConfig" ADD COLUMN IF NOT EXISTS "slinkCheckInterval" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "TelegramConfig" ADD COLUMN IF NOT EXISTS "lastSlinkCheckedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SlinkAnnouncementLog" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "title" TEXT,
    "publishDate" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlinkAnnouncementLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SlinkAnnouncementLog_username_announcementId_key" ON "SlinkAnnouncementLog"("username", "announcementId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SlinkAnnouncementLog_username_idx" ON "SlinkAnnouncementLog"("username");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SlinkAnnouncementLog_announcementId_idx" ON "SlinkAnnouncementLog"("announcementId");

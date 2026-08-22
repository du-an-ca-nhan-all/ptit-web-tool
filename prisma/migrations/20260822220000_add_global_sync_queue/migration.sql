-- CreateTable
CREATE TABLE "GlobalSyncBatch" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL DEFAULT 'SYSTEM_CRON',
    "scheduledTime" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "processingCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "cancelledCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalSyncBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalSyncQueueItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "studentName" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "resultMessage" TEXT,
    "resultData" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalSyncQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GlobalSyncBatch_jobType_idx" ON "GlobalSyncBatch"("jobType");
CREATE INDEX "GlobalSyncBatch_status_idx" ON "GlobalSyncBatch"("status");
CREATE INDEX "GlobalSyncBatch_triggeredBy_idx" ON "GlobalSyncBatch"("triggeredBy");
CREATE INDEX "GlobalSyncBatch_createdAt_idx" ON "GlobalSyncBatch"("createdAt");

-- CreateIndex
CREATE INDEX "GlobalSyncQueueItem_batchId_idx" ON "GlobalSyncQueueItem"("batchId");
CREATE INDEX "GlobalSyncQueueItem_username_idx" ON "GlobalSyncQueueItem"("username");
CREATE INDEX "GlobalSyncQueueItem_jobType_idx" ON "GlobalSyncQueueItem"("jobType");
CREATE INDEX "GlobalSyncQueueItem_status_idx" ON "GlobalSyncQueueItem"("status");
CREATE INDEX "GlobalSyncQueueItem_createdAt_idx" ON "GlobalSyncQueueItem"("createdAt");

-- AddForeignKey
ALTER TABLE "GlobalSyncQueueItem" ADD CONSTRAINT "GlobalSyncQueueItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "GlobalSyncBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

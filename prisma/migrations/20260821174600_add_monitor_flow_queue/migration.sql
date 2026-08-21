-- CreateTable
CREATE TABLE "MonitorFlowBatch" (
    "id" TEXT NOT NULL,
    "classCode" TEXT NOT NULL,
    "monitorUsername" TEXT NOT NULL,
    "flowAction" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "id_to_hoc" TEXT,
    "ma_mon" TEXT,
    "ten_mon" TEXT,
    "nhom_to" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "processingCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "cancelledCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitorFlowBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorFlowQueueItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "classCode" TEXT NOT NULL,
    "monitorUsername" TEXT NOT NULL,
    "followerUsername" TEXT NOT NULL,
    "followerName" TEXT,
    "flowAction" TEXT NOT NULL,
    "id_to_hoc" TEXT,
    "ma_mon" TEXT,
    "ten_mon" TEXT,
    "nhom_to" TEXT,
    "sv_nganh" INTEGER DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "resultMessage" TEXT,
    "resultData" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitorFlowQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitorFlowBatch_classCode_idx" ON "MonitorFlowBatch"("classCode");
CREATE INDEX "MonitorFlowBatch_monitorUsername_idx" ON "MonitorFlowBatch"("monitorUsername");
CREATE INDEX "MonitorFlowBatch_status_idx" ON "MonitorFlowBatch"("status");
CREATE INDEX "MonitorFlowBatch_createdAt_idx" ON "MonitorFlowBatch"("createdAt");

-- CreateIndex
CREATE INDEX "MonitorFlowQueueItem_batchId_idx" ON "MonitorFlowQueueItem"("batchId");
CREATE INDEX "MonitorFlowQueueItem_followerUsername_idx" ON "MonitorFlowQueueItem"("followerUsername");
CREATE INDEX "MonitorFlowQueueItem_status_idx" ON "MonitorFlowQueueItem"("status");
CREATE INDEX "MonitorFlowQueueItem_createdAt_idx" ON "MonitorFlowQueueItem"("createdAt");

-- AddForeignKey
ALTER TABLE "MonitorFlowQueueItem" ADD CONSTRAINT "MonitorFlowQueueItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MonitorFlowBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MonitorFlowConfig" (
    "id" SERIAL NOT NULL,
    "classCode" TEXT NOT NULL,
    "monitorUsername" TEXT NOT NULL,
    "followerUsername" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowRegisterCourse" BOOLEAN NOT NULL DEFAULT true,
    "allowCancelCourse" BOOLEAN NOT NULL DEFAULT true,
    "autoSyncOnAction" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "lastActionAt" TIMESTAMP(3),
    "lastActionType" TEXT,
    "lastActionResult" TEXT,
    "lastActionMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitorFlowConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitorFlowConfig_monitorUsername_followerUsername_key" ON "MonitorFlowConfig"("monitorUsername", "followerUsername");

-- CreateIndex
CREATE INDEX "MonitorFlowConfig_classCode_idx" ON "MonitorFlowConfig"("classCode");

-- CreateIndex
CREATE INDEX "MonitorFlowConfig_monitorUsername_idx" ON "MonitorFlowConfig"("monitorUsername");

-- CreateIndex
CREATE INDEX "MonitorFlowConfig_followerUsername_idx" ON "MonitorFlowConfig"("followerUsername");

-- CreateIndex
CREATE INDEX "MonitorFlowConfig_isEnabled_idx" ON "MonitorFlowConfig"("isEnabled");

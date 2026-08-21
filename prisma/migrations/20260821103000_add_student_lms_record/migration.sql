-- CreateTable
CREATE TABLE "StudentLmsRecord" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "userFullName" TEXT,
    "rawData" TEXT NOT NULL,
    "totalEnrolled" INTEGER DEFAULT 0,
    "totalCompleted" INTEGER DEFAULT 0,
    "completedActivities" INTEGER DEFAULT 0,
    "dueActivities" INTEGER DEFAULT 0,
    "lastPulledAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLmsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentLmsRecord_username_key" ON "StudentLmsRecord"("username");

-- CreateIndex
CREATE INDEX "StudentLmsRecord_username_idx" ON "StudentLmsRecord"("username");

-- CreateIndex
CREATE INDEX "StudentLmsRecord_lastPulledAt_idx" ON "StudentLmsRecord"("lastPulledAt");

-- AddForeignKey
ALTER TABLE "StudentLmsRecord" ADD CONSTRAINT "StudentLmsRecord_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

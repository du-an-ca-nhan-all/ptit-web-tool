-- CreateTable
CREATE TABLE "StudentSlinkGradeRecord" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "gpa10" DOUBLE PRECISION,
    "gpa4" DOUBLE PRECISION,
    "creditsAcc" INTEGER DEFAULT 0,
    "creditsPassed" INTEGER DEFAULT 0,
    "creditsReg" INTEGER DEFAULT 0,
    "classification" TEXT,
    "totalSubjects" INTEGER DEFAULT 0,
    "totalPassed" INTEGER DEFAULT 0,
    "totalFailed" INTEGER DEFAULT 0,
    "totalInProgress" INTEGER DEFAULT 0,
    "maKhoaNganh" TEXT,
    "tenKhoaNganh" TEXT,
    "lastPulledAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSlinkGradeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentSlinkGradeRecord_username_key" ON "StudentSlinkGradeRecord"("username");

-- CreateIndex
CREATE INDEX "StudentSlinkGradeRecord_username_idx" ON "StudentSlinkGradeRecord"("username");

-- CreateIndex
CREATE INDEX "StudentSlinkGradeRecord_gpa4_idx" ON "StudentSlinkGradeRecord"("gpa4");

-- CreateIndex
CREATE INDEX "StudentSlinkGradeRecord_classification_idx" ON "StudentSlinkGradeRecord"("classification");

-- CreateIndex
CREATE INDEX "StudentSlinkGradeRecord_lastPulledAt_idx" ON "StudentSlinkGradeRecord"("lastPulledAt");

-- AddForeignKey
ALTER TABLE "StudentSlinkGradeRecord" ADD CONSTRAINT "StudentSlinkGradeRecord_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

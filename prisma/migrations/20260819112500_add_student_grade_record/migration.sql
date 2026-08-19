-- CreateTable
CREATE TABLE "StudentGradeRecord" (
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
    "lastPulledAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGradeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentGradeRecord_username_key" ON "StudentGradeRecord"("username");

-- CreateIndex
CREATE INDEX "StudentGradeRecord_username_idx" ON "StudentGradeRecord"("username");

-- CreateIndex
CREATE INDEX "StudentGradeRecord_gpa4_idx" ON "StudentGradeRecord"("gpa4");

-- CreateIndex
CREATE INDEX "StudentGradeRecord_classification_idx" ON "StudentGradeRecord"("classification");

-- AddForeignKey
ALTER TABLE "StudentGradeRecord" ADD CONSTRAINT "StudentGradeRecord_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "StudentQldtExamRecord" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "semesterId" INTEGER,
    "semesterName" TEXT,
    "totalExams" INTEGER DEFAULT 0,
    "lastPulledAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentQldtExamRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentQldtExamRecord_username_key" ON "StudentQldtExamRecord"("username");

-- CreateIndex
CREATE INDEX "StudentQldtExamRecord_username_idx" ON "StudentQldtExamRecord"("username");

-- CreateIndex
CREATE INDEX "StudentQldtExamRecord_semesterId_idx" ON "StudentQldtExamRecord"("semesterId");

-- AddForeignKey
ALTER TABLE "StudentQldtExamRecord" ADD CONSTRAINT "StudentQldtExamRecord_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

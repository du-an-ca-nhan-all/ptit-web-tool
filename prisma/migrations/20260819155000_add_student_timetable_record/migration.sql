-- CreateTable
CREATE TABLE "StudentTimetableRecord" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "semesterId" INTEGER,
    "semesterName" TEXT,
    "totalSubjects" INTEGER DEFAULT 0,
    "totalEvents" INTEGER DEFAULT 0,
    "lastPulledAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTimetableRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentTimetableRecord_username_key" ON "StudentTimetableRecord"("username");

-- CreateIndex
CREATE INDEX "StudentTimetableRecord_username_idx" ON "StudentTimetableRecord"("username");

-- CreateIndex
CREATE INDEX "StudentTimetableRecord_semesterId_idx" ON "StudentTimetableRecord"("semesterId");

-- AddForeignKey
ALTER TABLE "StudentTimetableRecord" ADD CONSTRAINT "StudentTimetableRecord_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

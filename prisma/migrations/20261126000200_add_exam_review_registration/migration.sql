-- CreateTable
CREATE TABLE "ExamReviewRegistration" (
    "id" SERIAL NOT NULL,
    "batchCode" TEXT NOT NULL,
    "classCode" TEXT NOT NULL,
    "maSV" TEXT NOT NULL,
    "isRegistered" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamReviewRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamReviewRegistration_batchCode_classCode_idx" ON "ExamReviewRegistration"("batchCode", "classCode");

-- CreateIndex
CREATE INDEX "ExamReviewRegistration_batchCode_maSV_idx" ON "ExamReviewRegistration"("batchCode", "maSV");

-- CreateIndex
CREATE UNIQUE INDEX "ExamReviewRegistration_batchCode_classCode_maSV_key" ON "ExamReviewRegistration"("batchCode", "classCode", "maSV");

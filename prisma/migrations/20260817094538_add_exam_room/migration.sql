-- CreateTable
CREATE TABLE "ExamRoom" (
    "id" SERIAL NOT NULL,
    "roomKey" TEXT NOT NULL,
    "mapThi" TEXT NOT NULL,
    "maMH" TEXT,
    "tenMH" TEXT,
    "ngayThi" TEXT,
    "gioThi" TEXT,
    "maHTThi" TEXT,
    "batchCode" TEXT,
    "customPrice" INTEGER NOT NULL,
    "note" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_roomKey_key" ON "ExamRoom"("roomKey");

-- CreateIndex
CREATE INDEX "ExamRoom_roomKey_idx" ON "ExamRoom"("roomKey");

-- CreateIndex
CREATE INDEX "ExamRoom_mapThi_idx" ON "ExamRoom"("mapThi");

-- CreateIndex
CREATE INDEX "ExamRoom_batchCode_idx" ON "ExamRoom"("batchCode");

-- CreateIndex
CREATE INDEX "ExamRoom_ngayThi_idx" ON "ExamRoom"("ngayThi");

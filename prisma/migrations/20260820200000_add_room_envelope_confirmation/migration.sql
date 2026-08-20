-- CreateTable
CREATE TABLE "RoomEnvelopeConfirmation" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "batchCode" TEXT,
    "room" TEXT,
    "date" TEXT,
    "time" TEXT,
    "subjectCode" TEXT,
    "subject" TEXT,
    "assignedClass" TEXT NOT NULL,
    "claimedByUsername" TEXT NOT NULL,
    "claimedByName" TEXT,
    "assistantStudentId" TEXT,
    "assistantStudentName" TEXT,
    "customPrice" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomEnvelopeConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomEnvelopeConfirmation_sessionId_key" ON "RoomEnvelopeConfirmation"("sessionId");

-- CreateIndex
CREATE INDEX "RoomEnvelopeConfirmation_sessionId_idx" ON "RoomEnvelopeConfirmation"("sessionId");

-- CreateIndex
CREATE INDEX "RoomEnvelopeConfirmation_assignedClass_idx" ON "RoomEnvelopeConfirmation"("assignedClass");

-- CreateIndex
CREATE INDEX "RoomEnvelopeConfirmation_batchCode_idx" ON "RoomEnvelopeConfirmation"("batchCode");

-- CreateIndex
CREATE INDEX "RoomEnvelopeConfirmation_assistantStudentId_idx" ON "RoomEnvelopeConfirmation"("assistantStudentId");

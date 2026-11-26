import { prisma } from '@/src/lib/prisma';
import type { EnvelopeAssignment } from './types';

export async function fetchEnvelopeConfirmationRecords() {
  return prisma.roomEnvelopeConfirmation.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

export type EnvelopeConfirmationRecord = Awaited<
  ReturnType<typeof fetchEnvelopeConfirmationRecords>
>[number];

export function mapRecordsToAssignments(
  records: EnvelopeConfirmationRecord[],
  includeCustomPrice = true
): Record<string, EnvelopeAssignment> {
  const assignments: Record<string, EnvelopeAssignment> = {};
  records.forEach((r) => {
    assignments[r.sessionId] = {
      id: r.id,
      roomKey: r.sessionId,
      sessionId: r.sessionId,
      batchCode: r.batchCode || undefined,
      room: r.room || undefined,
      date: r.date || undefined,
      time: r.time || undefined,
      subjectCode: r.subjectCode || undefined,
      subject: r.subject || undefined,
      assignedClass: r.assignedClass,
      claimedByUsername: r.claimedByUsername,
      claimedByName: r.claimedByName || undefined,
      assistantStudentId: r.assistantStudentId || undefined,
      assistantStudentName: r.assistantStudentName || undefined,
      ...(includeCustomPrice ? { customPrice: r.customPrice ?? undefined } : {}),
      claimedAt: r.updatedAt.toISOString(),
      note: r.note || undefined,
    };
  });
  return assignments;
}

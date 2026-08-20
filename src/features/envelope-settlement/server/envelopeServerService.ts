import { prisma } from '@/src/lib/prisma';

export interface EnvelopeAssignment {
  id?: number;
  roomKey: string;
  sessionId?: string;
  batchCode?: string;
  room?: string;
  date?: string;
  time?: string;
  subjectCode?: string;
  subject?: string;
  assignedClass: string;
  claimedByUsername?: string;
  claimedByName?: string;
  assistantStudentId?: string;
  assistantStudentName?: string;
  customPrice?: number;
  claimedAt?: string;
  note?: string;
}

export const envelopeServerService = {
  /**
   * Lấy danh sách tất cả các xác nhận đi phong bì
   */
  async getAssignments(): Promise<Record<string, EnvelopeAssignment>> {
    const records = await prisma.roomEnvelopeConfirmation.findMany({
      orderBy: { updatedAt: 'desc' },
    });

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
        claimedByUsername: r.claimedByUsername || undefined,
        claimedByName: r.claimedByName || undefined,
        assistantStudentId: r.assistantStudentId || undefined,
        assistantStudentName: r.assistantStudentName || undefined,
        customPrice: r.customPrice ? Number(r.customPrice) : undefined,
        claimedAt: r.createdAt ? r.createdAt.toISOString() : undefined,
        note: r.note || undefined,
      };
    });

    return assignments;
  },

  /**
   * Lưu hoặc cập nhật xác nhận phong bì cho phòng thi
   */
  async saveAssignment(assignment: EnvelopeAssignment) {
    const {
      sessionId,
      batchCode,
      room,
      date,
      time,
      subjectCode,
      subject,
      assignedClass,
      claimedByUsername,
      claimedByName,
      assistantStudentId,
      assistantStudentName,
      customPrice,
      note,
    } = assignment;

    if (!sessionId || !assignedClass) {
      throw new Error('Thiếu sessionId hoặc assignedClass');
    }

    return prisma.roomEnvelopeConfirmation.upsert({
      where: { sessionId },
      create: {
        sessionId,
        batchCode,
        room,
        date,
        time,
        subjectCode,
        subject,
        assignedClass,
        claimedByUsername,
        claimedByName,
        assistantStudentId,
        assistantStudentName,
        customPrice: customPrice !== undefined ? customPrice : null,
        note,
      },
      update: {
        batchCode,
        room,
        date,
        time,
        subjectCode,
        subject,
        assignedClass,
        claimedByUsername,
        claimedByName,
        assistantStudentId,
        assistantStudentName,
        customPrice: customPrice !== undefined ? customPrice : null,
        note,
      },
    });
  },

  /**
   * Xóa xác nhận phong bì cho phòng thi
   */
  async deleteAssignment(sessionId: string) {
    return prisma.roomEnvelopeConfirmation.deleteMany({
      where: { sessionId },
    });
  },
};

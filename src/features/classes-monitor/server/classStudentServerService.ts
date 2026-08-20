import { prisma } from '../../../lib/prisma';

export const classStudentService = {
  /**
   * Get all students belonging to a class
   */
  async getStudentsByClass(classCode: string) {
    return prisma.student.findMany({
      where: {
        maLop: { equals: classCode, mode: 'insensitive' },
      },
      orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }],
    });
  },

  /**
   * Transfer student to another class
   */
  async transferStudentClass(studentId: string, targetClass: string, reason?: string) {
    return prisma.student.update({
      where: { maSV: studentId.toUpperCase() },
      data: {
        maLop: targetClass.toUpperCase(),
        ghiChu: reason ? `Chuyển lớp: ${reason}` : undefined,
      },
    });
  },

  /**
   * Update student phone and note
   */
  async updateStudentInfo(studentId: string, phone?: string, note?: string) {
    return prisma.student.update({
      where: { maSV: studentId.toUpperCase() },
      data: {
        soDienThoai: phone,
        ghiChu: note,
      },
    });
  },
};

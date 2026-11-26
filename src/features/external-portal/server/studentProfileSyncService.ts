import { prisma } from '@/src/lib/prisma';
import {
  fetchStudentInfoFromQLDTTX,
  QldttxStudentProfileInfo,
} from './qldttxServerService';

export interface SyncStudentProfileResult {
  synced: boolean;
  reason?: string;
  profile?: QldttxStudentProfileInfo;
  student?: {
    maSV: string;
    ngaySinh: string | null;
    gioiTinh: string | null;
    soDienThoai: string | null;
    soCMND: string | null;
    email1: string | null;
    email2: string | null;
    noiSinh: string | null;
    quocTich: string | null;
  };
}

/**
 * Đồng bộ thông tin cá nhân sinh viên từ QLHT (w-locsinhvieninfo) vào bảng Student.
 * Các trường đồng bộ: ngày sinh, giới tính, SĐT, số CMND, email 1, email 2, nơi sinh, quốc tịch.
 * Chấp nhận dữ liệu null hoặc rỗng từ QLHT mà không gây lỗi.
 */
export async function syncStudentProfileFromQLDTTX(params: {
  username: string;
  token?: string | null;
  extUsername?: string;
  extPassword?: string;
  skipIfNoAccount?: boolean;
}): Promise<SyncStudentProfileResult> {
  const normalizedUsername = String(params.username || '').trim().toUpperCase();
  if (!normalizedUsername) {
    return { synced: false, reason: 'MISSING_USERNAME' };
  }

  let extAccountId: number | null = null;
  let extUsername = params.extUsername?.trim() || normalizedUsername;
  let extPassword = params.extPassword;
  let token = params.token;

  if (!token && !extPassword) {
    const extAccount = await prisma.externalAccount.findFirst({
      where: {
        username: { equals: normalizedUsername, mode: 'insensitive' },
        systemKey: 'QLDTTX_PTTC1',
      },
    });

    if (!extAccount) {
      if (params.skipIfNoAccount) {
        return { synced: false, reason: 'NO_EXTERNAL_ACCOUNT' };
      }
      throw new Error('Chưa liên kết tài khoản Cổng QLHT (QLDTTX PTTC1) để đồng bộ thông tin');
    }

    extAccountId = extAccount.id;
    extUsername = extAccount.extUsername || normalizedUsername;
    extPassword = extAccount.extPassword || undefined;
    token = extAccount.token;
  }

  const { profile, newToken } = await fetchStudentInfoFromQLDTTX({
    username: extUsername,
    password: extPassword,
    token,
  });

  // Nếu token vừa được làm mới trong quá trình gọi API, cập nhật lại vào ExternalAccount
  if (newToken) {
    try {
      if (extAccountId) {
        await prisma.externalAccount.update({
          where: { id: extAccountId },
          data: {
            token: newToken,
            status: 'CONNECTED',
            lastSyncAt: new Date(),
          },
        });
      } else {
        await prisma.externalAccount.updateMany({
          where: {
            username: { equals: normalizedUsername, mode: 'insensitive' },
            systemKey: 'QLDTTX_PTTC1',
          },
          data: {
            token: newToken,
            status: 'CONNECTED',
            lastSyncAt: new Date(),
          },
        });
      }
    } catch (tokenSaveErr) {
      console.warn('[syncStudentProfileFromQLDTTX] Failed to persist refreshed token:', tokenSaveErr);
    }
  }

  const existingStudent = await prisma.student.findFirst({
    where: { maSV: { equals: normalizedUsername, mode: 'insensitive' } },
  });

  if (!existingStudent) {
    return { synced: false, reason: 'STUDENT_NOT_FOUND', profile };
  }

  const updated = await prisma.student.update({
    where: { id: existingStudent.id },
    data: {
      ngaySinh: profile.ngaySinh ?? existingStudent.ngaySinh ?? null,
      gioiTinh: profile.gioiTinh ?? existingStudent.gioiTinh ?? null,
      soDienThoai: profile.soDienThoai ?? existingStudent.soDienThoai ?? null,
      soCMND: profile.soCMND ?? existingStudent.soCMND ?? null,
      email1: profile.email1 ?? existingStudent.email1 ?? null,
      email2: profile.email2 ?? existingStudent.email2 ?? null,
      noiSinh: profile.noiSinh ?? existingStudent.noiSinh ?? null,
      quocTich: profile.quocTich ?? existingStudent.quocTich ?? null,
    },
    select: {
      maSV: true,
      ngaySinh: true,
      gioiTinh: true,
      soDienThoai: true,
      soCMND: true,
      email1: true,
      email2: true,
      noiSinh: true,
      quocTich: true,
    },
  });

  return {
    synced: true,
    profile,
    student: updated,
  };
}

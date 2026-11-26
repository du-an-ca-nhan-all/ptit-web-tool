import { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { dispatchNewUserRegistered } from '@/src/features/telegram/server/telegramDispatcher';
import {
  AUTO_APPROVE_NOTE_SUFFIX,
  AUTO_APPROVE_REVIEWER,
  QLDTTX_SYSTEM_CONFIG,
} from './constants';

type StudentRecord = NonNullable<Awaited<ReturnType<typeof prisma.student.findUnique>>>;

export interface AutoApproveRegistrationParams {
  req: NextRequest;
  ip: string;
  student: StudentRecord;
  cleanUsername: string;
  cleanPassword: string;
  hashedPassword: string;
  qldtToken: string;
  finalFullName: string;
  finalLop: string | null;
  finalPhone: string;
  note?: string | null;
}

export async function executeAutoApproveRegistration({
  req,
  ip,
  student,
  cleanUsername,
  cleanPassword,
  hashedPassword,
  qldtToken,
  finalFullName,
  finalLop,
  finalPhone,
  note,
}: AutoApproveRegistrationParams) {
  // 6. Check if an existing registration request exists
  const existingPending = await prisma.registrationRequest.findFirst({
    where: {
      username: cleanUsername,
    },
    orderBy: { createdAt: 'desc' },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Mật khẩu KHỚP với QLHT -> Tự động kích hoạt & liên kết ExternalAccount ngay lập tức
  // ─────────────────────────────────────────────────────────────────────────
  // 6.1 Update student info if missing
  const studentUpdate: any = {};
  if (finalFullName && !student.hoTen) studentUpdate.hoTen = finalFullName;
  if (finalPhone && !student.soDienThoai) studentUpdate.soDienThoai = finalPhone;
  if (finalLop && !student.maLop) studentUpdate.maLop = finalLop;
  if (Object.keys(studentUpdate).length > 0) {
    await prisma.student.update({
      where: { id: student.id },
      data: studentUpdate,
    });
  }

  // 6.2 Upsert User (Activate immediately)
  await prisma.user.upsert({
    where: { username: cleanUsername },
    create: {
      username: cleanUsername,
      passwordHash: hashedPassword,
      role: 'sinh_vien',
      isActive: true,
    },
    update: {
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  // 6.3 Auto-configure ExternalAccount for QLDTTX (QLHT)
  await prisma.externalAccount.upsert({
    where: {
      username_systemKey: {
        username: cleanUsername,
        systemKey: QLDTTX_SYSTEM_CONFIG.systemKey,
      },
    },
    create: {
      username: cleanUsername,
      systemKey: QLDTTX_SYSTEM_CONFIG.systemKey,
      systemName: QLDTTX_SYSTEM_CONFIG.systemName,
      systemUrl: QLDTTX_SYSTEM_CONFIG.systemUrl,
      extUsername: cleanUsername,
      extPassword: cleanPassword,
      token: qldtToken,
      status: 'CONNECTED',
      lastSyncAt: new Date(),
      syncMessage: QLDTTX_SYSTEM_CONFIG.syncMessage,
    },
    update: {
      systemName: QLDTTX_SYSTEM_CONFIG.systemName,
      systemUrl: QLDTTX_SYSTEM_CONFIG.systemUrl,
      extUsername: cleanUsername,
      extPassword: cleanPassword,
      token: qldtToken,
      status: 'CONNECTED',
      lastSyncAt: new Date(),
      syncMessage: QLDTTX_SYSTEM_CONFIG.syncMessage,
    },
  });

  // 6.4 Record RegistrationRequest as APPROVED
  const regNoteText = note ? String(note).trim() : null;
  const autoNote = regNoteText
    ? `${regNoteText} | ${AUTO_APPROVE_NOTE_SUFFIX}`
    : AUTO_APPROVE_NOTE_SUFFIX;

  let regRequest;
  if (existingPending) {
    regRequest = await prisma.registrationRequest.update({
      where: { id: existingPending.id },
      data: {
        fullName: finalFullName,
        lop: finalLop,
        phoneNumber: finalPhone || null,
        passwordHash: hashedPassword,
        note: autoNote,
        status: 'APPROVED',
        reviewedBy: AUTO_APPROVE_REVIEWER,
        reviewedAt: new Date(),
      },
    });
  } else {
    regRequest = await prisma.registrationRequest.create({
      data: {
        username: cleanUsername,
        fullName: finalFullName,
        lop: finalLop,
        phoneNumber: finalPhone || null,
        passwordHash: hashedPassword,
        note: autoNote,
        status: 'APPROVED',
        reviewedBy: AUTO_APPROVE_REVIEWER,
        reviewedAt: new Date(),
      },
    });
  }

  // 6.5 Log activity
  await logActivity({
    req,
    username: cleanUsername,
    action: 'AUTO_APPROVE_REGISTRATION',
    targetType: 'REGISTRATION',
    targetId: String(regRequest.id),
    description: `Tài khoản sinh viên ${cleanUsername} (${finalFullName} - Lớp ${finalLop || 'Chưa rõ'}) được TỰ ĐỘNG DUYỆT & LIÊN KẾT QLHT thành công do mật khẩu khớp Cổng QLDTTX`,
    metadata: {
      username: cleanUsername,
      fullName: finalFullName,
      lop: finalLop,
      phoneNumber: finalPhone,
      requestId: regRequest.id,
      autoApproved: true,
      hasToken: true,
    },
  });

  // 6.6 Dispatch Telegram Notification to Admin
  dispatchNewUserRegistered({
    username: cleanUsername,
    fullName: finalFullName,
    lop: finalLop,
    phoneNumber: finalPhone,
    note: autoNote,
    status: 'APPROVED',
    ip,
  }).catch((err) => console.error('[Registration] Failed to dispatch telegram notification:', err));

  return regRequest;
}

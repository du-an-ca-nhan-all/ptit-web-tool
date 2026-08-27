import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashSHA512 } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { dispatchNewUserRegistered } from '@/src/features/telegram/server/telegramDispatcher';
import { loginAndGetToken } from '@/src/features/external-portal/server/qldttxServerService';

// GET /api/auth/register?username=K25DTCN402
// Lookup student existence, name, and class for registration auto-display
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.trim().toUpperCase();

    if (!username || username.length < 3) {
      return NextResponse.json({ found: false, error: 'Mã sinh viên không hợp lệ' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { maSV: username },
      include: {
        user: {
          select: {
            passwordHash: true,
            isActive: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({
        found: false,
        error: `Mã sinh viên "${username}" không tồn tại trong hệ thống.`,
      });
    }

    const hasPassword = Boolean(
      student.user?.passwordHash && student.user.passwordHash.trim() !== ''
    );

    return NextResponse.json({
      found: true,
      student: {
        maSV: student.maSV,
        hoTen: student.hoTen || student.ten || student.maSV,
        maLop: student.maLop,
        soDienThoai: student.soDienThoai,
        hasPassword,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/auth/register
// Submit registration request with SHA-512 passwordHash & student validation
// Auto-approve & auto-configure ExternalAccount if password matches QLDTTX (QLHT)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, confirmPassword, phoneNumber, note } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Mã sinh viên và Mật khẩu.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toUpperCase();
    const cleanPassword = String(password).trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Mã sinh viên phải có ít nhất 3 ký tự.' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự để đảm bảo an toàn.' },
        { status: 400 }
      );
    }

    if (confirmPassword && cleanPassword !== String(confirmPassword).trim()) {
      return NextResponse.json(
        { error: 'Mật khẩu nhập lại không trùng khớp.' },
        { status: 400 }
      );
    }

    // 1. Check if student exists in Student table (MANDATORY)
    const student = await prisma.student.findUnique({
      where: { maSV: cleanUsername },
    });

    if (!student) {
      return NextResponse.json(
        {
          error: `Mã sinh viên "${cleanUsername}" không tồn tại trong danh sách sinh viên trường. Vui lòng kiểm tra lại hoặc liên hệ Quản trị viên để được hỗ trợ.`,
        },
        { status: 400 }
      );
    }

    // 2. Check existing User account password status
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser && existingUser.passwordHash && existingUser.passwordHash.trim() !== '') {
      return NextResponse.json(
        {
          error: 'Tài khoản này đã được kích hoạt mật khẩu. Nếu bạn quên mật khẩu, vui lòng liên hệ Quản trị viên để được đặt lại.',
        },
        { status: 400 }
      );
    }

    // 3. Extract info directly from Student record
    const finalFullName = String(student.hoTen || student.ten || cleanUsername).trim();
    const finalLop = student.maLop ? String(student.maLop).trim() : null;
    const finalPhone = String(phoneNumber || student.soDienThoai || '').trim();

    // 4. Hash password with SHA-512 (128 hex chars)
    const hashedPassword = hashSHA512(cleanPassword);

    // 5. Test credentials against QLHT (Cổng QLDTTX PTTC1) with a safe 7s timeout
    let qldtToken: string | null = null;
    let isMatchedQlht = false;

    try {
      const tokenPromise = loginAndGetToken({
        username: cleanUsername,
        password: cleanPassword,
      });
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('QLDTTX login timeout')), 7000)
      );

      const tokenRes = await Promise.race([tokenPromise, timeoutPromise]);
      if (tokenRes && tokenRes.startsWith('Bearer ')) {
        qldtToken = tokenRes;
        isMatchedQlht = true;
      }
    } catch {
      // Non-matching password or network/timeout -> gracefully fallback to manual admin review
      qldtToken = null;
      isMatchedQlht = false;
    }

    // 6. Check if an existing registration request exists
    const existingPending = await prisma.registrationRequest.findFirst({
      where: {
        username: cleanUsername,
      },
      orderBy: { createdAt: 'desc' },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CASE A: Mật khẩu KHỚP với QLHT (Auto-Approve & Auto-Configure ExternalAccount)
    // ─────────────────────────────────────────────────────────────────────────
    if (isMatchedQlht && qldtToken) {
      // A1. Update student info if missing
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

      // A2. Upsert User (Activate immediately)
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

      // A3. Auto-configure ExternalAccount for QLDTTX (QLHT)
      await prisma.externalAccount.upsert({
        where: {
          username_systemKey: {
            username: cleanUsername,
            systemKey: 'QLDTTX_PTTC1',
          },
        },
        create: {
          username: cleanUsername,
          systemKey: 'QLDTTX_PTTC1',
          systemName: 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
          systemUrl: 'https://qldttx.pttc1.edu.vn/',
          extUsername: cleanUsername,
          extPassword: cleanPassword,
          token: qldtToken,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: 'Đã tự động xác thực và liên kết qua Cổng QLDTTX khi đăng ký tài khoản',
        },
        update: {
          systemName: 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
          systemUrl: 'https://qldttx.pttc1.edu.vn/',
          extUsername: cleanUsername,
          extPassword: cleanPassword,
          token: qldtToken,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: 'Đã tự động xác thực và liên kết qua Cổng QLDTTX khi đăng ký tài khoản',
        },
      });

      // A4. Update RegistrationRequest to APPROVED
      const regNoteText = note ? String(note).trim() : null;
      const autoNote = regNoteText
        ? `${regNoteText} | [Tự động duyệt: Mật khẩu khớp Cổng QLDTTX (QLHT)]`
        : '[Tự động duyệt: Mật khẩu khớp Cổng QLDTTX (QLHT)]';

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
            reviewedBy: 'TỰ ĐỘNG (QLHT)',
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
            reviewedBy: 'TỰ ĐỘNG (QLHT)',
            reviewedAt: new Date(),
          },
        });
      }

      // A5. Log activity
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

      // A6. Dispatch Telegram Notification to Admin
      dispatchNewUserRegistered({
        username: cleanUsername,
        fullName: finalFullName,
        lop: finalLop,
        phoneNumber: finalPhone,
        note: autoNote,
        status: 'APPROVED',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      }).catch((err) => console.error('[Registration] Failed to dispatch telegram notification:', err));

      return NextResponse.json({
        success: true,
        autoApproved: true,
        message:
          'Đăng ký tài khoản thành công! Mật khẩu khớp với Cổng QLDTTX (QLHT), tài khoản của bạn đã được TỰ ĐỘNG KÍCH HOẠT và liên kết QLHT ngay lập tức. Bạn có thể đăng nhập ngay bây giờ!',
        request: {
          id: regRequest.id,
          username: regRequest.username,
          fullName: regRequest.fullName,
          lop: regRequest.lop,
          status: regRequest.status,
          createdAt: regRequest.createdAt.toISOString(),
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASE B: Mật khẩu KHÔNG khớp QLHT hoặc timeout (Pending Admin Review)
    // ─────────────────────────────────────────────────────────────────────────
    let regRequest;
    if (existingPending) {
      regRequest = await prisma.registrationRequest.update({
        where: { id: existingPending.id },
        data: {
          fullName: finalFullName,
          lop: finalLop,
          phoneNumber: finalPhone || null,
          passwordHash: hashedPassword,
          note: note ? String(note).trim() : existingPending.note,
          status: 'PENDING',
          reviewedBy: null,
          reviewedAt: null,
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
          note: note ? String(note).trim() : null,
          status: 'PENDING',
        },
      });
    }

    // B1. Log activity
    await logActivity({
      req,
      username: cleanUsername,
      action: 'REGISTER_REQUEST',
      targetType: 'REGISTRATION',
      targetId: String(regRequest.id),
      description: `Sinh viên ${cleanUsername} (${finalFullName} - Lớp ${finalLop || 'Chưa rõ'}) gửi yêu cầu đăng ký tài khoản (chờ duyệt)`,
      metadata: {
        username: cleanUsername,
        fullName: finalFullName,
        lop: finalLop,
        phoneNumber: finalPhone,
        requestId: regRequest.id,
        autoApproved: false,
      },
    });

    // B2. Dispatch Telegram Notification to Admin (Asynchronous)
    dispatchNewUserRegistered({
      username: cleanUsername,
      fullName: finalFullName,
      lop: finalLop,
      phoneNumber: finalPhone,
      note: note ? String(note).trim() : null,
      status: regRequest.status,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    }).catch((err) => console.error('[Registration] Failed to dispatch telegram notification:', err));

    return NextResponse.json({
      success: true,
      autoApproved: false,
      message: 'Đăng ký tài khoản thành công! Yêu cầu của bạn đã được gửi và đang chờ Quản trị viên phê duyệt kích hoạt.',
      request: {
        id: regRequest.id,
        username: regRequest.username,
        fullName: regRequest.fullName,
        lop: regRequest.lop,
        status: regRequest.status,
        createdAt: regRequest.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi gửi yêu cầu đăng ký tài khoản.' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin, getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';

async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

// GET /api/auth/registrations
// Query registration requests with filtering & summary counts (Admin only)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role) || (authUser as any).isAdmin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xem danh sách yêu cầu đăng ký' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim().toUpperCase();
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { fullName: { contains: search } },
        { lop: { contains: search } },
        { phoneNumber: { contains: search } },
        { note: { contains: search } },
      ];
    }

    const [requests, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.registrationRequest.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.registrationRequest.count({ where }),
      prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
      prisma.registrationRequest.count({ where: { status: 'APPROVED' } }),
      prisma.registrationRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        username: r.username,
        fullName: r.fullName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        lop: r.lop,
        status: r.status,
        note: r.note,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch registration requests error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi tải danh sách đăng ký' }, { status: 500 });
  }
}

// POST /api/auth/registrations
// Actions: 'APPROVE' | 'REJECT' | 'DELETE' | 'BULK_APPROVE' | 'BULK_REJECT' (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role) || (authUser as any).isAdmin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền duyệt yêu cầu đăng ký' }, { status: 403 });
    }

    const body = await req.json();
    const { action = 'APPROVE', id, ids, reason } = body;

    let targetIds: number[] = [];
    if (Array.isArray(ids) && ids.length > 0) {
      targetIds = ids.map((i: any) => Number(i)).filter((n: number) => !isNaN(n));
    } else if (id) {
      targetIds = [Number(id)];
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một yêu cầu đăng ký' }, { status: 400 });
    }

    const requests = await prisma.registrationRequest.findMany({
      where: { id: { in: targetIds } },
    });

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy yêu cầu đăng ký nào phù hợp' }, { status: 404 });
    }

    if (action === 'APPROVE' || action === 'BULK_APPROVE') {
      let approvedCount = 0;

      for (const item of requests) {
        // 1. Update RegistrationRequest
        await prisma.registrationRequest.update({
          where: { id: item.id },
          data: {
            status: 'APPROVED',
            reviewedBy: authUser.username,
            reviewedAt: new Date(),
          },
        });

        // 2. Upsert Student info first (Foreign key prerequisite for User)
        const existingStudent = await prisma.student.findUnique({
          where: { maSV: item.username },
        });

        if (existingStudent) {
          const updateData: any = {};
          if (item.fullName && !existingStudent.hoTen) updateData.hoTen = item.fullName;
          if (item.phoneNumber && !existingStudent.soDienThoai) updateData.soDienThoai = item.phoneNumber;
          if (item.lop && !existingStudent.maLop) updateData.maLop = item.lop;

          if (Object.keys(updateData).length > 0) {
            await prisma.student.update({
              where: { id: existingStudent.id },
              data: updateData,
            });
          }
        } else {
          await prisma.student.create({
            data: {
              maSV: item.username,
              hoTen: item.fullName || item.username,
              ten: item.fullName ? item.fullName.split(' ').pop() : item.username,
              soDienThoai: item.phoneNumber || null,
              maLop: item.lop || null,
              trangThai: 'DANG_HOC',
            },
          });
        }

        // 3. Upsert/Update User with new password
        const existingUser = await prisma.user.findUnique({
          where: { username: item.username },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              passwordHash: item.passwordHash,
              isActive: true,
            },
          });
        } else {
          await prisma.user.create({
            data: {
              username: item.username,
              passwordHash: item.passwordHash,
              role: 'sinh_vien',
              isActive: true,
            },
          });
        }

        // 4. Log activity
        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'APPROVE_REGISTRATION',
          targetType: 'REGISTRATION',
          targetId: item.username,
          description: `Admin ${authUser.username} đã duyệt kích hoạt tài khoản sinh viên ${item.username} (${item.fullName || ''})`,
          metadata: {
            requestId: item.id,
            username: item.username,
            fullName: item.fullName,
            lop: item.lop,
          },
        });

        approvedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Đã duyệt thành công ${approvedCount} yêu cầu đăng ký tài khoản!`,
        approvedCount,
      });
    } else if (action === 'REJECT' || action === 'BULK_REJECT') {
      let rejectedCount = 0;

      for (const item of requests) {
        await prisma.registrationRequest.update({
          where: { id: item.id },
          data: {
            status: 'REJECTED',
            note: reason ? String(reason).trim() : item.note,
            reviewedBy: authUser.username,
            reviewedAt: new Date(),
          },
        });

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'REJECT_REGISTRATION',
          targetType: 'REGISTRATION',
          targetId: item.username,
          description: `Admin ${authUser.username} đã từ chối yêu cầu đăng ký của ${item.username}${reason ? ` - Lý do: ${reason}` : ''}`,
          metadata: {
            requestId: item.id,
            username: item.username,
            reason: reason || null,
          },
        });

        rejectedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Đã từ chối ${rejectedCount} yêu cầu đăng ký!`,
        rejectedCount,
      });
    } else if (action === 'DELETE') {
      const deleteRes = await prisma.registrationRequest.deleteMany({
        where: { id: { in: targetIds } },
      });

      return NextResponse.json({
        success: true,
        message: `Đã xoá ${deleteRes.count} bản ghi yêu cầu đăng ký!`,
        deletedCount: deleteRes.count,
      });
    } else {
      return NextResponse.json({ error: 'Hành động không hợp lệ (APPROVE, REJECT, DELETE)' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Process registration request error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xử lý yêu cầu đăng ký' }, { status: 500 });
  }
}

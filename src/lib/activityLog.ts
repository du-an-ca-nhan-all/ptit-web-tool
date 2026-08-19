import { prisma } from './prisma';
import { NextRequest } from 'next/server';
import { getAuthUser } from './auth';

export interface LogParams {
  req?: NextRequest;
  userId?: number | null;
  username?: string | null;
  userRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  description: string;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Ghi log hành động của người dùng và hệ thống vào bảng ActivityLog
 */
export async function logActivity(params: LogParams): Promise<void> {
  try {
    let {
      req,
      userId,
      username,
      userRole,
      action,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress,
      userAgent,
    } = params;

    // Tự động trích xuất thông tin người dùng từ request nếu chưa có
    if (!username && req) {
      try {
        const auth = await getAuthUser(req);
        if (auth) {
          userId = auth.id;
          username = auth.username;
          userRole = auth.role;
        }
      } catch {
        // Ignore auth extraction error in logger
      }
    }

    // Tự động trích xuất IP và User Agent từ request
    if (req) {
      if (!ipAddress) {
        ipAddress =
          req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          req.headers.get('x-real-ip') ||
          null;
      }
      if (!userAgent) {
        userAgent = req.headers.get('user-agent') || null;
      }
    }

    const metadataStr =
      metadata !== undefined && metadata !== null
        ? typeof metadata === 'string'
          ? metadata
          : JSON.stringify(metadata)
        : null;

    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        username: username || null,
        userRole: userRole || null,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        description,
        metadata: metadataStr,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error('[ActivityLog] Lỗi ghi nhật ký hành động:', err);
  }
}

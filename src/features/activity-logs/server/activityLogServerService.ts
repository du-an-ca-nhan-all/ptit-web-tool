import { prisma } from '@/src/lib/prisma';
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/src/lib/auth';

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

export interface GetActivityLogsParams {
  username?: string;
  isAdmin: boolean;
  targetUsername?: string;
  action?: string;
  targetType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const activityLogService = {
  /**
   * Ghi log hành động của người dùng và hệ thống vào bảng ActivityLog
   */
  async logActivity(params: LogParams): Promise<void> {
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
  },

  /**
   * Lấy danh sách activity logs với bộ lọc và phân trang
   */
  async getLogs(params: GetActivityLogsParams) {
    const {
      username,
      isAdmin,
      targetUsername,
      action,
      targetType,
      search,
      page = 1,
      limit = 50,
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (!isAdmin) {
      where.username = username;
    } else if (targetUsername) {
      where.username = targetUsername.trim().toUpperCase();
    }

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Lấy các action distinct để filter
   */
  async getDistinctActions() {
    const actionsRaw = await prisma.activityLog.findMany({
      distinct: ['action'],
      select: { action: true },
    });
    return actionsRaw.map((a) => a.action);
  },

  /**
   * Xóa logs cũ hơn N ngày (Admin only)
   */
  async cleanupOldLogs(daysOlderThan: number = 30) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysOlderThan);

    const deleted = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: dateLimit,
        },
      },
    });

    return deleted.count;
  },
};

export const logActivity = activityLogService.logActivity;

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@repo/database';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      totalPosts,
      totalCommunities,
      totalComments,
      pendingReports,
      totalReports,
      activeRestrictions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.community.count({ where: { deletedAt: null } }),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.report.count(),
      this.prisma.userRestriction.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalCommunities,
      totalComments,
      pendingReports,
      totalReports,
      activeRestrictions,
    };
  }

  async getUsers(params: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.search) {
      where.OR = [
        { username: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role && Object.values(Role).includes(params.role as Role)) {
      where.role = params.role;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isVerified: true,
          createdAt: true,
          profile: {
            select: {
              reputationScore: true,
              contributionCount: true,
              avatarUrl: true,
            },
          },
          restrictions: {
            where: { isActive: true },
            select: { id: true, type: true, reason: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserStatus(
    targetUserId: string,
    adminId: string,
    updates: { role?: string; banned?: boolean; banReason?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update role if provided
    if (updates.role && Object.values(Role).includes(updates.role as Role)) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: { role: updates.role as Role },
      });

      await this.auditService.log({
        actorId: adminId,
        action: 'USER_ROLE_CHANGED',
        entityType: 'user',
        entityId: targetUserId,
        metadata: { previousRole: user.role, newRole: updates.role },
      });
    }

    // Handle ban/unban
    if (updates.banned === true) {
      await this.prisma.userRestriction.create({
        data: {
          userId: targetUserId,
          type: 'ban',
          reason: updates.banReason || 'Banned by admin',
          isActive: true,
          createdById: adminId,
        },
      });

      await this.auditService.log({
        actorId: adminId,
        action: 'USER_BANNED',
        entityType: 'user',
        entityId: targetUserId,
        metadata: { reason: updates.banReason },
      });
    } else if (updates.banned === false) {
      await this.prisma.userRestriction.updateMany({
        where: { userId: targetUserId, isActive: true, type: 'ban' },
        data: { isActive: false },
      });

      await this.auditService.log({
        actorId: adminId,
        action: 'USER_UNBANNED',
        entityType: 'user',
        entityId: targetUserId,
      });
    }

    return this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        restrictions: {
          where: { isActive: true },
          select: { id: true, type: true, reason: true },
        },
      },
    });
  }

  async getFeatureFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateFeatureFlag(
    key: string,
    adminId: string,
    updates: {
      enabled?: boolean;
      rolloutPercentage?: number;
      description?: string;
    },
  ) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });

    if (!flag) {
      throw new NotFoundException(`Feature flag '${key}' not found`);
    }

    if (updates.rolloutPercentage !== undefined) {
      if (updates.rolloutPercentage < 0 || updates.rolloutPercentage > 100) {
        throw new BadRequestException(
          'rolloutPercentage must be between 0 and 100',
        );
      }
    }

    const updated = await this.prisma.featureFlag.update({
      where: { key },
      data: {
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.rolloutPercentage !== undefined && {
          rolloutPercentage: updates.rolloutPercentage,
        }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'FEATURE_FLAG_UPDATED',
      entityType: 'feature_flag',
      entityId: flag.id,
      metadata: {
        key,
        previousEnabled: flag.enabled,
        newEnabled: updates.enabled,
        previousRollout: flag.rolloutPercentage,
        newRollout: updates.rolloutPercentage,
      },
    });

    return updated;
  }

  async createFeatureFlag(
    adminId: string,
    data: { key: string; description?: string; enabled?: boolean },
  ) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new BadRequestException(
        `Feature flag '${data.key}' already exists`,
      );
    }

    const flag = await this.prisma.featureFlag.create({
      data: {
        key: data.key,
        description: data.description,
        enabled: data.enabled ?? false,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'FEATURE_FLAG_CREATED',
      entityType: 'feature_flag',
      entityId: flag.id,
      metadata: { key: data.key },
    });

    return flag;
  }
}

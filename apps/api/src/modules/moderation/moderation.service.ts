import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';
import { PostStatus, ReportStatus } from '@repo/database';

@Injectable()
export class ModerationService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    // Validate target exists
    const validTypes = ['post', 'comment', 'user'];
    if (!validTypes.includes(dto.targetType)) {
      throw new BadRequestException(
        `targetType must be one of: ${validTypes.join(', ')}`,
      );
    }

    if (dto.targetType === 'post') {
      const post = await this.prisma.post.findUnique({
        where: { id: dto.targetId },
      });
      if (!post) throw new NotFoundException('Post not found');
    } else if (dto.targetType === 'comment') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: dto.targetId },
      });
      if (!comment) throw new NotFoundException('Comment not found');
    } else if (dto.targetType === 'user') {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.targetId },
      });
      if (!user) throw new NotFoundException('User not found');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details,
      },
      include: {
        reporter: {
          select: { id: true, username: true },
        },
      },
    });

    await this.auditService.log({
      actorId: reporterId,
      action: 'REPORT_CREATED',
      entityType: 'report',
      entityId: report.id,
      metadata: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
      },
    });

    this.eventEmitter.emit('content.reported', {
      reportId: report.id,
      reporterId,
      targetType: dto.targetType,
      targetId: dto.targetId,
    });

    return report;
  }

  async getReports(params: { status?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (
      params.status &&
      Object.values(ReportStatus).includes(params.status as ReportStatus)
    ) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, username: true },
          },
          assignedTo: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveReport(
    reportId: string,
    moderatorId: string,
    dto: ResolveReportDto,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.action,
        assignedToId: moderatorId,
      },
      include: {
        reporter: { select: { id: true, username: true } },
        assignedTo: { select: { id: true, username: true } },
      },
    });

    await this.auditService.log({
      actorId: moderatorId,
      action: `REPORT_${dto.action}`,
      entityType: 'report',
      entityId: reportId,
      metadata: { reason: dto.reason, previousStatus: report.status },
    });

    return updatedReport;
  }

  async createModerationAction(
    moderatorId: string,
    dto: CreateModerationActionDto,
  ) {
    const action = await this.prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        targetUserId: dto.targetUserId,
        actionType: dto.actionType,
        reason: dto.reason,
      },
      include: {
        moderator: { select: { id: true, username: true } },
        targetUser: { select: { id: true, username: true } },
      },
    });

    // Execute the action based on type
    if (dto.actionType === 'remove_content') {
      if (dto.targetType === 'post') {
        await this.prisma.post.update({
          where: { id: dto.targetId },
          data: { deletedAt: new Date(), status: PostStatus.REMOVED },
        });
      } else if (dto.targetType === 'comment') {
        await this.prisma.comment.update({
          where: { id: dto.targetId },
          data: { deletedAt: new Date() },
        });
      }
    }

    if (dto.actionType === 'ban' && dto.targetUserId) {
      await this.prisma.userRestriction.create({
        data: {
          userId: dto.targetUserId,
          type: 'ban',
          reason: dto.reason,
          isActive: true,
          createdById: moderatorId,
        },
      });
    }

    if (dto.actionType === 'restrict' && dto.targetUserId) {
      await this.prisma.userRestriction.create({
        data: {
          userId: dto.targetUserId,
          type: 'post_restrict',
          reason: dto.reason,
          isActive: true,
          createdById: moderatorId,
        },
      });
    }

    if (dto.actionType === 'unban' && dto.targetUserId) {
      await this.prisma.userRestriction.updateMany({
        where: {
          userId: dto.targetUserId,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    await this.auditService.log({
      actorId: moderatorId,
      action: `MODERATION_${dto.actionType.toUpperCase()}`,
      entityType: dto.targetType,
      entityId: dto.targetId,
      metadata: {
        actionType: dto.actionType,
        targetUserId: dto.targetUserId,
        reason: dto.reason,
      },
    });

    this.eventEmitter.emit('moderation.action.created', {
      actionId: action.id,
      moderatorId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      actionType: dto.actionType,
    });

    return action;
  }

  async getUserRestrictions(userId: string) {
    return this.prisma.userRestriction.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

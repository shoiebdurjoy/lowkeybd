import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { MemberRole } from '@repo/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommunitiesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateCommunityDto) {
    const existing = await this.prisma.community.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: dto.slug }],
      },
    });

    if (existing) {
      if (existing.slug === dto.slug) {
        throw new ConflictException('Community slug is already taken');
      }
      throw new ConflictException('Community name is already taken');
    }

    const community = await this.prisma.community.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        avatarUrl: dto.avatarUrl,
        bannerUrl: dto.bannerUrl,
      },
    });

    // Create the creator as ADMIN member
    await this.prisma.communityMember.create({
      data: {
        userId,
        communityId: community.id,
        role: MemberRole.ADMIN,
      },
    });

    this.eventEmitter.emit('community.created', { communityId: community.id });

    return community;
  }

  async findAll() {
    return this.prisma.community.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
      },
    });
  }

  async findOne(slug: string, userId?: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, deletedAt: null },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    let membership = null;
    if (userId) {
      membership = await this.prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId: community.id,
          },
        },
      });
    }

    return {
      ...community,
      membership,
    };
  }

  async update(slug: string, userId: string, dto: UpdateCommunityDto) {
    const community = await this.prisma.community.findUnique({
      where: { slug, deletedAt: null },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if the user is an ADMIN or MODERATOR
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== MemberRole.ADMIN &&
        membership.role !== MemberRole.MODERATOR)
    ) {
      throw new ForbiddenException(
        'You do not have permission to edit this community',
      );
    }

    const updated = await this.prisma.community.update({
      where: { id: community.id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
      },
    });

    this.eventEmitter.emit('community.updated', { communityId: updated.id });

    return updated;
  }

  async join(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, deletedAt: null },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const existingMembership = await this.prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
    });

    if (existingMembership) {
      return existingMembership;
    }

    return this.prisma.communityMember.create({
      data: {
        userId,
        communityId: community.id,
        role: MemberRole.MEMBER,
      },
    });
  }

  async leave(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, deletedAt: null },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const membership = await this.prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this community');
    }

    if (membership.role === MemberRole.ADMIN) {
      const adminCount = await this.prisma.communityMember.count({
        where: {
          communityId: community.id,
          role: MemberRole.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot leave as the last admin. Appoint another admin first or contact support.',
        );
      }
    }

    await this.prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
    });

    return { message: 'Successfully left the community' };
  }

  async getPosts(slug: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, deletedAt: null },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return this.prisma.post.findMany({
      where: {
        communityId: community.id,
        deletedAt: null,
        status: 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { avatarUrl: true, reputationScore: true },
            },
          },
        },
        _count: {
          select: { comments: true, votes: true },
        },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }
}

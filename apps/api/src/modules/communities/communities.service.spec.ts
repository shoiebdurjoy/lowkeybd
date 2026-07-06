/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../../common/database/prisma.service';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MemberRole } from '@repo/database';

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    community: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    communityMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommunitiesService>(CommunitiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a community and register creator as ADMIN', async () => {
      const dto = {
        name: 'DU Tech Club',
        slug: 'du-tech-club',
        description: 'Test',
      };
      const communityMock = { id: 'c1', ...dto };

      mockPrismaService.community.findFirst.mockResolvedValue(null);
      mockPrismaService.community.create.mockResolvedValue(communityMock);
      mockPrismaService.communityMember.create.mockResolvedValue({
        userId: 'u1',
        communityId: 'c1',
        role: MemberRole.ADMIN,
      });

      const result = await service.create('u1', dto);

      expect(result).toEqual(communityMock);
      expect(prisma.community.create).toHaveBeenCalledWith({ data: dto });
      expect(prisma.communityMember.create).toHaveBeenCalledWith({
        data: { userId: 'u1', communityId: 'c1', role: MemberRole.ADMIN },
      });
    });

    it('should throw ConflictException if slug or name is taken', async () => {
      const dto = { name: 'DU Tech Club', slug: 'du-tech-club' };
      mockPrismaService.community.findFirst.mockResolvedValue({
        id: 'c1',
        slug: 'du-tech-club',
        name: 'Other',
      });

      await expect(service.create('u1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all communities', async () => {
      const communitiesMock = [
        { id: 'c1', name: 'DU Tech Club', slug: 'du-tech-club' },
      ];
      mockPrismaService.community.findMany.mockResolvedValue(communitiesMock);

      const result = await service.findAll();
      expect(result).toEqual(communitiesMock);
      expect(prisma.community.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return community and membership if user is logged in', async () => {
      const communityMock = {
        id: 'c1',
        name: 'DU Tech Club',
        slug: 'du-tech-club',
      };
      const membershipMock = {
        userId: 'u1',
        communityId: 'c1',
        role: MemberRole.MEMBER,
      };

      mockPrismaService.community.findUnique.mockResolvedValue(communityMock);
      mockPrismaService.communityMember.findUnique.mockResolvedValue(
        membershipMock,
      );

      const result = await service.findOne('du-tech-club', 'u1');

      expect(result).toEqual({ ...communityMock, membership: membershipMock });
      expect(prisma.community.findUnique).toHaveBeenCalled();
      expect(prisma.communityMember.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException if community does not exist', async () => {
      mockPrismaService.community.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update community if user is ADMIN', async () => {
      const communityMock = {
        id: 'c1',
        name: 'DU Tech Club',
        slug: 'du-tech-club',
      };
      const dto = { description: 'Updated' };

      mockPrismaService.community.findUnique.mockResolvedValue(communityMock);
      mockPrismaService.communityMember.findUnique.mockResolvedValue({
        role: MemberRole.ADMIN,
      });
      mockPrismaService.community.update.mockResolvedValue({
        ...communityMock,
        ...dto,
      });

      const result = await service.update('du-tech-club', 'u1', dto);

      expect(result.description).toEqual('Updated');
    });

    it('should throw ForbiddenException if user is regular member', async () => {
      const communityMock = {
        id: 'c1',
        name: 'DU Tech Club',
        slug: 'du-tech-club',
      };
      mockPrismaService.community.findUnique.mockResolvedValue(communityMock);
      mockPrismaService.communityMember.findUnique.mockResolvedValue({
        role: MemberRole.MEMBER,
      });

      await expect(
        service.update('du-tech-club', 'u1', { description: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('join', () => {
    it('should join community', async () => {
      const communityMock = { id: 'c1', slug: 'du-tech-club' };
      mockPrismaService.community.findUnique.mockResolvedValue(communityMock);
      mockPrismaService.communityMember.findUnique.mockResolvedValue(null);
      mockPrismaService.communityMember.create.mockResolvedValue({
        userId: 'u1',
        communityId: 'c1',
        role: MemberRole.MEMBER,
      });

      const result = await service.join('du-tech-club', 'u1');

      expect(result.role).toEqual(MemberRole.MEMBER);
    });
  });

  describe('leave', () => {
    it('should leave community if not the last admin', async () => {
      const communityMock = { id: 'c1', slug: 'du-tech-club' };
      mockPrismaService.community.findUnique.mockResolvedValue(communityMock);
      mockPrismaService.communityMember.findUnique.mockResolvedValue({
        role: MemberRole.ADMIN,
      });
      mockPrismaService.communityMember.count.mockResolvedValue(2); // Another admin exists
      mockPrismaService.communityMember.delete.mockResolvedValue({});

      const result = await service.leave('du-tech-club', 'u1');

      expect(result.message).toContain('Successfully left');
    });

    it('should throw BadRequestException if last admin tries to leave', async () => {
      const communityMock = { id: 'c1', slug: 'du-tech-club' };
      mockPrismaService.community.findUnique.mockResolvedValue(communityMock);
      mockPrismaService.communityMember.findUnique.mockResolvedValue({
        role: MemberRole.ADMIN,
      });
      mockPrismaService.communityMember.count.mockResolvedValue(1); // Only 1 admin

      await expect(service.leave('du-tech-club', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

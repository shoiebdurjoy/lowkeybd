/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { VotingService } from './voting.service';
import { PrismaService } from '../../common/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VotingService', () => {
  let service: VotingService;
  let prisma: PrismaService;

  const mockPrisma = {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: {
      update: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VotingService>(VotingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('votePost', () => {
    it('should throw NotFoundException if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.votePost('user-1', 'post-1', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if voting on own post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
      });
      await expect(service.votePost('user-1', 'post-1', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create an upvote when none exists', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-2',
      });
      mockPrisma.vote.findUnique.mockResolvedValue(null);

      await service.votePost('user-1', 'post-1', 1);

      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', postId: 'post-1', value: 1 },
      });
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: {
          upvotes: { increment: 1 },
          downvotes: { increment: 0 },
          score: { increment: 1 },
        },
      });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
        data: { reputationScore: { increment: 10 } },
      });
    });

    it('should cancel an upvote with value 0', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-2',
      });
      mockPrisma.vote.findUnique.mockResolvedValue({ id: 'vote-1', value: 1 });

      await service.votePost('user-1', 'post-1', 0);

      expect(prisma.vote.delete).toHaveBeenCalledWith({
        where: { id: 'vote-1' },
      });
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: {
          upvotes: { increment: -1 },
          downvotes: { increment: 0 },
          score: { increment: -1 },
        },
      });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
        data: { reputationScore: { increment: -10 } },
      });
    });
  });

  describe('voteComment', () => {
    it('should throw NotFoundException if comment not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);
      await expect(
        service.voteComment('user-1', 'comment-1', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if voting on own comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'comment-1',
        authorId: 'user-1',
      });
      await expect(
        service.voteComment('user-1', 'comment-1', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an upvote for comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'comment-1',
        authorId: 'user-2',
      });
      mockPrisma.vote.findUnique.mockResolvedValue(null);

      await service.voteComment('user-1', 'comment-1', 1);

      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', commentId: 'comment-1', value: 1 },
      });
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { score: { increment: 1 } },
      });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
        data: { reputationScore: { increment: 2 } },
      });
    });
  });
});

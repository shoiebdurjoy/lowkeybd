/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../../common/database/prisma.service';
import { PostType, PostStatus } from '@repo/database';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('ContentService', () => {
  let service: ContentService;
  let prisma: PrismaService;

  const mockPrisma = {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    community: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post without a community', async () => {
      const dto = {
        title: 'Test Post',
        content: 'Hello world this is content',
        type: PostType.DISCUSSION,
      };
      const userId = 'user-1';
      const mockPost = {
        id: 'post-1',
        ...dto,
        authorId: userId,
        status: PostStatus.PUBLISHED,
      };

      mockPrisma.post.create.mockResolvedValue(mockPost);

      const result = await service.createPost(userId, dto);
      expect(result).toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: dto.title,
            content: dto.content,
            authorId: userId,
          }),
        }),
      );
    });

    it('should throw BadRequestException if communityId is invalid', async () => {
      const dto = {
        title: 'Test Post',
        content: 'Hello world this is content',
        communityId: 'bad-community-id',
      };

      mockPrisma.community.findUnique.mockResolvedValue(null);

      await expect(service.createPost('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPost', () => {
    it('should return a post when it exists', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test',
        content: 'Content',
        deletedAt: null,
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      const result = await service.getPost('post-1');
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.getPost('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePost', () => {
    it('should update a post for the author', async () => {
      const mockPost = { id: 'post-1', authorId: 'user-1', deletedAt: null };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.update.mockResolvedValue({
        ...mockPost,
        title: 'Updated Title',
      });

      const result = await service.updatePost('post-1', 'user-1', {
        title: 'Updated Title',
      });
      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException for non-author', async () => {
      const mockPost = { id: 'post-1', authorId: 'user-2', deletedAt: null };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.updatePost('post-1', 'user-1', { title: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('should soft delete a post for the author', async () => {
      const mockPost = { id: 'post-1', authorId: 'user-1', deletedAt: null };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.update.mockResolvedValue({
        ...mockPost,
        deletedAt: new Date(),
      });

      const result = await service.deletePost('post-1', 'user-1');
      expect(result.message).toContain('deleted');
    });

    it('should throw ForbiddenException for non-author', async () => {
      const mockPost = { id: 'post-1', authorId: 'user-2', deletedAt: null };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.deletePost('post-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createComment', () => {
    it('should create a comment on an existing post', async () => {
      const mockPost = { id: 'post-1', deletedAt: null };
      const mockComment = {
        id: 'comment-1',
        content: 'Great post!',
        postId: 'post-1',
        authorId: 'user-1',
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.post.update.mockResolvedValue({});

      const result = await service.createComment('post-1', 'user-1', {
        content: 'Great post!',
      });
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(
        service.createComment('nonexistent', 'user-1', { content: 'Hm' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('should soft delete a comment for the author', async () => {
      const mockComment = {
        id: 'comment-1',
        authorId: 'user-1',
        postId: 'post-1',
        deletedAt: null,
      };
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        ...mockComment,
        deletedAt: new Date(),
      });
      mockPrisma.post.update.mockResolvedValue({});

      const result = await service.deleteComment('comment-1', 'user-1');
      expect(result.message).toContain('deleted');
    });

    it('should throw ForbiddenException for non-author', async () => {
      const mockComment = {
        id: 'comment-1',
        authorId: 'user-2',
        postId: 'post-1',
        deletedAt: null,
      };
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      await expect(
        service.deleteComment('comment-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

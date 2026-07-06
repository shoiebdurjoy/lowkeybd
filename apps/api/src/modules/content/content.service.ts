import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PostStatus, PostType } from '@repo/database';

const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      username: true,
      profile: {
        select: { avatarUrl: true, reputationScore: true },
      },
    },
  },
  community: {
    select: { id: true, name: true, slug: true, avatarUrl: true },
  },
  _count: {
    select: { comments: true, votes: true },
  },
};

const COMMENT_INCLUDE = {
  author: {
    select: {
      id: true,
      username: true,
      profile: {
        select: { avatarUrl: true },
      },
    },
  },
  replies: {
    where: { deletedAt: null },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: { replies: true, votes: true },
  },
};

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ---- POSTS ----

  async createPost(userId: string, dto: CreatePostDto) {
    // Verify community exists if communityId provided
    if (dto.communityId) {
      const community = await this.prisma.community.findUnique({
        where: { id: dto.communityId, deletedAt: null },
      });
      if (!community) {
        throw new BadRequestException('Community not found');
      }
    }

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type ?? PostType.DISCUSSION,
        status: PostStatus.PUBLISHED,
        authorId: userId,
        communityId: dto.communityId,
        publishedAt: new Date(),
      },
      include: POST_INCLUDE,
    });

    this.eventEmitter.emit('post.created', { postId: post.id });

    return post;
  }

  async getPost(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id, deletedAt: null, status: PostStatus.PUBLISHED },
      include: POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count (fire and forget)
    void this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    let userVote = 0;
    if (userId) {
      const vote = await this.prisma.vote.findUnique({
        where: {
          userId_postId: {
            userId,
            postId: id,
          },
        },
      });
      if (vote) {
        userVote = vote.value;
      }
    }

    return {
      ...post,
      userVote,
    };
  }

  async updatePost(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.type !== undefined && { type: dto.type }),
      },
      include: POST_INCLUDE,
    });

    this.eventEmitter.emit('post.updated', { postId: updated.id });

    return updated;
  }

  async deletePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete
    await this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date(), status: PostStatus.REMOVED },
    });

    this.eventEmitter.emit('post.deleted', { postId: id });

    return { message: 'Post deleted successfully' };
  }

  async getPostComments(postId: string, userId?: string) {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Top-level comments only (parentId is null)
    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null, deletedAt: null },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });

    if (!userId) {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
      const attachZeroVotes = (commentList: any[]): any[] => {
        return commentList.map((c) => {
          const replies = c.replies ? attachZeroVotes(c.replies) : [];
          return {
            ...c,
            userVote: 0,
            replies,
          };
        });
      };
      return attachZeroVotes(comments);
    }

    // Fetch user votes for comments on this post
    const userVotes = await this.prisma.vote.findMany({
      where: {
        userId,
        commentId: { not: null },
        comment: { postId },
      },
    });

    const voteMap = new Map<string, number>();
    userVotes.forEach((v) => {
      if (v.commentId) voteMap.set(v.commentId, v.value);
    });

    // Recursively attach userVote to comments and replies
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
    const attachVotes = (commentList: any[]): any[] => {
      return commentList.map((c) => {
        const replies = c.replies ? attachVotes(c.replies) : [];
        return {
          ...c,
          userVote: voteMap.get(c.id) || 0,
          replies,
        };
      });
    };

    return attachVotes(comments);
  }

  async getCommunityFeed(communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, deletedAt: null },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return this.prisma.post.findMany({
      where: {
        communityId,
        deletedAt: null,
        status: PostStatus.PUBLISHED,
      },
      include: POST_INCLUDE,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async getGlobalFeed() {
    return this.prisma.post.findMany({
      where: { deletedAt: null, status: PostStatus.PUBLISHED },
      include: POST_INCLUDE,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  // ---- COMMENTS ----

  async createComment(postId: string, userId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Validate parent comment if provided
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId, postId, deletedAt: null },
      });

      if (!parent) {
        throw new BadRequestException('Parent comment not found in this post');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId: userId,
        parentId: dto.parentId,
      },
      include: COMMENT_INCLUDE,
    });

    // Update post comment count
    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    // Update parent reply count
    if (dto.parentId) {
      await this.prisma.comment.update({
        where: { id: dto.parentId },
        data: { replyCount: { increment: 1 } },
      });
    }

    this.eventEmitter.emit('post.updated', { postId });
    this.eventEmitter.emit('comment.created', {
      commentId: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      parentId: comment.parentId,
      content: comment.content,
    });

    return comment;
  }

  async updateComment(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
      },
      include: COMMENT_INCLUDE,
    });

    this.eventEmitter.emit('post.updated', { postId: updated.postId });

    return updated;
  }

  async deleteComment(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete
    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Decrement post comment count
    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });

    this.eventEmitter.emit('post.updated', { postId: comment.postId });

    return { message: 'Comment deleted successfully' };
  }
}

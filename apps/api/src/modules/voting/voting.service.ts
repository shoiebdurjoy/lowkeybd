import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class VotingService {
  constructor(private prisma: PrismaService) {}

  async votePost(userId: string, postId: string, value: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId === userId) {
      throw new BadRequestException('You cannot vote on your own post');
    }

    const existingVote = await this.prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let upvoteDiff = 0;
    let downvoteDiff = 0;
    let repDiff = 0;

    await this.prisma.$transaction(async (tx) => {
      if (value === 0) {
        if (existingVote) {
          // Delete existing vote
          await tx.vote.delete({
            where: { id: existingVote.id },
          });

          if (existingVote.value === 1) {
            upvoteDiff = -1;
            repDiff = -10;
          } else if (existingVote.value === -1) {
            downvoteDiff = -1;
            repDiff = 2; // Cancel downvote (+2)
          }
        }
      } else if (value === 1) {
        if (!existingVote) {
          // Create upvote
          await tx.vote.create({
            data: {
              userId,
              postId,
              value: 1,
            },
          });
          upvoteDiff = 1;
          repDiff = 10;
        } else if (existingVote.value === -1) {
          // Change downvote to upvote
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: 1 },
          });
          upvoteDiff = 1;
          downvoteDiff = -1;
          repDiff = 12; // Cancel downvote (+2) and add upvote (+10)
        }
      } else if (value === -1) {
        if (!existingVote) {
          // Create downvote
          await tx.vote.create({
            data: {
              userId,
              postId,
              value: -1,
            },
          });
          downvoteDiff = 1;
          repDiff = -2;
        } else if (existingVote.value === 1) {
          // Change upvote to downvote
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: -1 },
          });
          upvoteDiff = -1;
          downvoteDiff = 1;
          repDiff = -12; // Cancel upvote (-10) and add downvote (-2)
        }
      }

      // Apply updates if there is any difference
      if (upvoteDiff !== 0 || downvoteDiff !== 0) {
        const scoreDiff = upvoteDiff - downvoteDiff;

        await tx.post.update({
          where: { id: postId },
          data: {
            upvotes: { increment: upvoteDiff },
            downvotes: { increment: downvoteDiff },
            score: { increment: scoreDiff },
          },
        });

        if (repDiff !== 0) {
          await tx.profile.update({
            where: { userId: post.authorId },
            data: {
              reputationScore: { increment: repDiff },
            },
          });
        }
      }
    });

    // Return the updated counts/status
    const updatedPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        upvotes: true,
        downvotes: true,
        score: true,
      },
    });

    return {
      message: 'Vote cast successfully',
      post: updatedPost,
      userVote: value,
    };
  }

  async voteComment(userId: string, commentId: string, value: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId === userId) {
      throw new BadRequestException('You cannot vote on your own comment');
    }

    const existingVote = await this.prisma.vote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    let scoreDiff = 0;
    let repDiff = 0;

    await this.prisma.$transaction(async (tx) => {
      if (value === 0) {
        if (existingVote) {
          await tx.vote.delete({
            where: { id: existingVote.id },
          });

          if (existingVote.value === 1) {
            scoreDiff = -1;
            repDiff = -2;
          } else if (existingVote.value === -1) {
            scoreDiff = 1;
            repDiff = 1; // Cancel downvote (+1)
          }
        }
      } else if (value === 1) {
        if (!existingVote) {
          await tx.vote.create({
            data: {
              userId,
              commentId,
              value: 1,
            },
          });
          scoreDiff = 1;
          repDiff = 2;
        } else if (existingVote.value === -1) {
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: 1 },
          });
          scoreDiff = 2;
          repDiff = 3; // Cancel downvote (+1) and add upvote (+2)
        }
      } else if (value === -1) {
        if (!existingVote) {
          await tx.vote.create({
            data: {
              userId,
              commentId,
              value: -1,
            },
          });
          scoreDiff = -1;
          repDiff = -1;
        } else if (existingVote.value === 1) {
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: -1 },
          });
          scoreDiff = -2;
          repDiff = -3; // Cancel upvote (-2) and add downvote (-1)
        }
      }

      if (scoreDiff !== 0) {
        await tx.comment.update({
          where: { id: commentId },
          data: {
            score: { increment: scoreDiff },
          },
        });

        if (repDiff !== 0) {
          await tx.profile.update({
            where: { userId: comment.authorId },
            data: {
              reputationScore: { increment: repDiff },
            },
          });
        }
      }
    });

    const updatedComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        score: true,
      },
    });

    return {
      message: 'Vote cast successfully',
      comment: updatedComment,
      userVote: value,
    };
  }
}

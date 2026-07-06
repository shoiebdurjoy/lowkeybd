/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { MailerService } from '@nestjs-modules/mailer';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@repo/database';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly mailerService: MailerService,
  ) {}

  // --- PREFERENCES ---

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: {
          userId,
        },
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, data: any) {
    // Ensure preference record exists first
    await this.getPreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        newCommentInApp: data.newCommentInApp,
        newCommentEmail: data.newCommentEmail,
        newReplyInApp: data.newReplyInApp,
        newReplyEmail: data.newReplyEmail,
        newMentionInApp: data.newMentionInApp,
        newMentionEmail: data.newMentionEmail,
      },
    });
  }

  // --- CORE NOTIFICATIONS ACTION ---

  async createNotification(payload: {
    userId: string;
    actorId: string | null;
    type: NotificationType;
    title: string;
    body: string;
    entityType: string;
    entityId: string;
  }) {
    const { userId, actorId, type, title, body, entityType, entityId } =
      payload;

    // Check preferences
    const prefs = await this.getPreferences(userId);
    let inAppEnabled = true;
    let emailEnabled = false;

    if (type === NotificationType.NEW_COMMENT) {
      inAppEnabled = prefs.newCommentInApp;
      emailEnabled = prefs.newCommentEmail;
    } else if (type === NotificationType.NEW_REPLY) {
      inAppEnabled = prefs.newReplyInApp;
      emailEnabled = prefs.newReplyEmail;
    } else if (type === NotificationType.MENTION) {
      inAppEnabled = prefs.newMentionInApp;
      emailEnabled = prefs.newMentionEmail;
    }

    let notification: any = null;

    if (inAppEnabled) {
      // Save notification to database
      notification = await this.prisma.notification.create({
        data: {
          userId,
          actorId,
          type,
          title,
          body,
          entityType,
          entityId,
        },
        include: {
          actor: {
            select: {
              username: true,
              profile: {
                select: { avatarUrl: true },
              },
            },
          },
        },
      });

      // Send via WebSocket
      this.gateway.sendNotificationToUser(userId, notification);
    }

    if (emailEnabled) {
      // Send email notification asynchronously
      this.sendEmailNotification(userId, title, body).catch((err) => {
        this.logger.error(
          `Failed to send email notification to user ${userId}`,
          err,
        );
      });
    }

    return notification;
  }

  private async sendEmailNotification(
    userId: string,
    title: string,
    body: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) return;

    await this.mailerService.sendMail({
      to: user.email,
      subject: `[LowKeyBD] ${title}`,
      text: `${body}\n\nView this on LowKeyBD: http://localhost:3000/notifications`,
    });
  }

  // --- QUERY METHODS ---

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            username: true,
            profile: {
              select: { avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notif || notif.userId !== userId) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // --- EVENT LISTENERS ---

  @OnEvent('comment.created')
  async handleCommentCreated(payload: {
    commentId: string;
    postId: string;
    authorId: string;
    parentId: string | null;
    content: string;
  }) {
    try {
      const commenter = await this.prisma.user.findUnique({
        where: { id: payload.authorId },
      });

      const post = await this.prisma.post.findUnique({
        where: { id: payload.postId },
      });

      if (!commenter || !post) return;

      const commenterName = commenter.username;
      const contentExcerpt =
        payload.content.length > 50
          ? `${payload.content.substring(0, 50)}...`
          : payload.content;

      // Case 1: Reply to a comment
      if (payload.parentId) {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: payload.parentId },
        });

        if (parentComment) {
          // Notify parent comment author if they are not the commenter
          if (parentComment.authorId !== payload.authorId) {
            await this.createNotification({
              userId: parentComment.authorId,
              actorId: payload.authorId,
              type: NotificationType.NEW_REPLY,
              title: 'New Reply to Your Comment',
              body: `u/${commenterName} replied to your comment: "${contentExcerpt}"`,
              entityType: 'POST', // Link directly to post page
              entityId: payload.postId,
            });
          }

          // Also notify post author if they are not the commenter AND they are not the parent comment author (to avoid double notification)
          if (
            post.authorId !== payload.authorId &&
            post.authorId !== parentComment.authorId
          ) {
            await this.createNotification({
              userId: post.authorId,
              actorId: payload.authorId,
              type: NotificationType.NEW_COMMENT,
              title: 'New Comment on Your Post',
              body: `u/${commenterName} commented on your post "${post.title}": "${contentExcerpt}"`,
              entityType: 'POST',
              entityId: payload.postId,
            });
          }
        }
      } else {
        // Case 2: Top-level comment
        // Notify post author if they are not the commenter
        if (post.authorId !== payload.authorId) {
          await this.createNotification({
            userId: post.authorId,
            actorId: payload.authorId,
            type: NotificationType.NEW_COMMENT,
            title: 'New Comment on Your Post',
            body: `u/${commenterName} commented on your post "${post.title}": "${contentExcerpt}"`,
            entityType: 'POST',
            entityId: payload.postId,
          });
        }
      }
    } catch (err) {
      this.logger.error('Error handling comment.created event', err);
    }
  }
}

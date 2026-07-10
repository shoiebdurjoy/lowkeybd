import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      if (!authHeader) {
        this.logger.debug('No auth token found, disconnecting client');
        client.disconnect();
        return;
      }

      // Handle both "Bearer <token>" and raw "<token>"
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

      const payload = this.jwtService.verify<{ sub: string }>(token);
      const userId = payload.sub;
      if (!userId) {
        this.logger.debug('Invalid token payload, disconnecting client');
        client.disconnect();
        return;
      }

      // Check if user is banned
      const ban = await this.prisma.userRestriction.findFirst({
        where: {
          userId,
          type: 'ban',
          isActive: true,
        },
      });

      if (ban) {
        this.logger.debug(
          `Banned user ${userId} attempted to connect. Disconnecting client.`,
        );
        client.disconnect();
        return;
      }

      // Join client to their specific user room
      void client.join(userId);
      this.logger.log(
        `Client ${client.id} authenticated for user ${userId} and joined room`,
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.debug(
        `Authentication failed: ${errMsg}. Disconnecting client`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(userId).emit('notification', notification);
  }
}

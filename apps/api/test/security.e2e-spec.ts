import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './../src/common/database/prisma.service';
import { NotificationsGateway } from './../src/modules/notifications/notifications.gateway';
import { SearchService } from './../src/modules/search/search.service';
import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';

describe('Security and Hardening (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let gateway: NotificationsGateway;
  let searchService: SearchService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure E2E app exactly like main.ts
    app.setGlobalPrefix('api');

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader(
        'Permissions-Policy',
        'geolocation=(), camera=(), microphone=()',
      );
      next();
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    jwtService = app.get(JwtService);
    gateway = app.get(NotificationsGateway);
    searchService = app.get(SearchService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Global Security Headers', () => {
    it('should set Helmet-style security headers on all HTTP responses', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/posts');

      expect(response.headers['content-security-policy']).toBe(
        "default-src 'self'",
      );
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin',
      );
      expect(response.headers['permissions-policy']).toBe(
        'geolocation=(), camera=(), microphone=()',
      );
    });
  });

  describe('API Rate Limiting', () => {
    it('should limit rapid requests and return 429 Too Many Requests', async () => {
      // Login endpoint has a limit of 20 requests per minute.
      // We will perform requests sequentially to avoid race conditions.
      let has429 = false;
      for (let i = 0; i < 30; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'password123' });
        if (res.status === 429) {
          has429 = true;
          break;
        }
      }
      expect(has429).toBe(true);
    });
  });

  describe('Secure Search Reindexing', () => {
    it('should block unauthenticated access (returns 401)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/search/reindex')
        .expect(401);
    });

    it('should block non-admin users (returns 403)', async () => {
      const userToken = jwtService.sign({
        sub: 'regular-user',
        role: 'USER',
        isVerified: true,
      });

      await request(app.getHttpServer())
        .post('/api/v1/search/reindex')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow admins (returns 201)', async () => {
      const adminToken = jwtService.sign({
        sub: 'admin-user',
        role: 'ADMIN',
        isVerified: true,
      });

      jest.spyOn(searchService, 'reindexAll').mockResolvedValue({
        postsIndexed: 0,
        communitiesIndexed: 0,
      });

      await request(app.getHttpServer())
        .post('/api/v1/search/reindex')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);
    });
  });

  describe('WebSocket Ban Checking', () => {
    it('should allow clean users to connect and join room', async () => {
      const userToken = jwtService.sign({
        sub: 'good-user',
        role: 'USER',
        isVerified: true,
      });

      const gatewayPrisma = (gateway as unknown as { prisma: PrismaService })
        .prisma;
      jest
        .spyOn(gatewayPrisma.userRestriction, 'findFirst')
        .mockResolvedValue(null);

      const disconnectSpy = jest.fn();
      const joinSpy = jest.fn();
      const mockSocket = {
        handshake: {
          auth: { token: userToken },
          query: {},
        },
        disconnect: disconnectSpy,
        join: joinSpy,
        id: 'test-socket-clean',
      } as unknown as Socket;

      await gateway.handleConnection(mockSocket);

      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(joinSpy).toHaveBeenCalledWith('good-user');
    });

    it('should disconnect banned users immediately', async () => {
      const bannedToken = jwtService.sign({
        sub: 'banned-user',
        role: 'USER',
        isVerified: true,
      });

      const mockBan = {
        id: 'ban-id-123',
        userId: 'banned-user',
        type: 'ban',
        isActive: true,
        reason: 'Violation of Terms',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
        createdById: 'admin-id',
      };

      const gatewayPrisma = (gateway as unknown as { prisma: PrismaService })
        .prisma;
      const findFirstSpy = jest
        .spyOn(gatewayPrisma.userRestriction, 'findFirst')
        .mockResolvedValue(mockBan);

      const disconnectSpy = jest.fn();
      const joinSpy = jest.fn();
      const mockSocket = {
        handshake: {
          auth: { token: bannedToken },
          query: {},
        },
        disconnect: disconnectSpy,
        join: joinSpy,
        id: 'test-socket-banned',
      } as unknown as Socket;

      await gateway.handleConnection(mockSocket);

      expect(findFirstSpy).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(joinSpy).not.toHaveBeenCalled();
    });
  });
});

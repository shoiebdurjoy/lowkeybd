/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';

import { PrismaService } from '../../common/database/prisma.service';

describe('CommunitiesController', () => {
  let controller: CommunitiesController;
  let service: CommunitiesService;

  const mockCommunitiesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    getPosts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunitiesController],
      providers: [
        {
          provide: CommunitiesService,
          useValue: mockCommunitiesService,
        },
        {
          provide: PrismaService,
          useValue: {
            userRestriction: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
            user: {
              findUnique: jest.fn().mockResolvedValue({ isVerified: true }),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<CommunitiesController>(CommunitiesController);
    service = module.get<CommunitiesService>(CommunitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should delegate to service.findAll', async () => {
      mockCommunitiesService.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should delegate to service.create', async () => {
      const dto = { name: 'DU Tech Club', slug: 'du-tech-club' };
      const req = { user: { userId: 'u1' } };
      mockCommunitiesService.create.mockResolvedValue({ id: 'c1', ...dto });

      const result = await controller.create(req, dto);

      expect(result.id).toEqual('c1');
      expect(service.create).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('findOne', () => {
    it('should extract userId from token and find community', async () => {
      const commMock = { id: 'c1', name: 'DU Tech Club', slug: 'du-tech-club' };
      mockCommunitiesService.findOne.mockResolvedValue(commMock);

      // Construct a mock JWT token with sub = 'u1'
      const payload = { sub: 'u1' };
      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
        'base64',
      );
      const token = `header.${payloadBase64}.signature`;
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const result = await controller.findOne('du-tech-club', req as any);

      expect(result).toEqual(commMock);
      expect(service.findOne).toHaveBeenCalledWith('du-tech-club', 'u1');
    });

    it('should pass undefined userId if authorization header is absent', async () => {
      mockCommunitiesService.findOne.mockResolvedValue({});
      const req = { headers: {} };

      await controller.findOne('du-tech-club', req as any);

      expect(service.findOne).toHaveBeenCalledWith('du-tech-club', undefined);
    });
  });
});

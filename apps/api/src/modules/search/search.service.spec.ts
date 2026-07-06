/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../common/database/prisma.service';

import { mockSearchIndex } from '../../../test/mocks/meilisearch';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockPrisma = {
    post: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    community: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize indexes and update settings', async () => {
      await service.onModuleInit();
      expect(mockSearchIndex.updateSettings).toHaveBeenCalled();
    });
  });

  describe('indexPost', () => {
    it('should query prisma and add document to index', async () => {
      const mockPost = {
        id: 'p1',
        title: 'Tech',
        content: 'Content',
        type: 'DISCUSSION',
        score: 5,
        author: { username: 'user1' },
        community: { name: 'Com1', slug: 'com1' },
        createdAt: new Date('2026-07-06T12:00:00Z'),
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      await service.indexPost('p1');

      expect(prisma.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p1', deletedAt: null } }),
      );
      expect(mockSearchIndex.addDocuments).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'p1', title: 'Tech' }),
      ]);
    });
  });

  describe('search', () => {
    it('should call search on meilisearch index', async () => {
      mockSearchIndex.search.mockResolvedValue({
        hits: [{ id: 'p1', title: 'Tech' }],
      });

      const result = await service.search('Tech', 'posts');

      expect(result.posts).toBeDefined();
      expect(mockSearchIndex.search).toHaveBeenCalledWith(
        'Tech',
        expect.any(Object),
      );
    });
  });
});

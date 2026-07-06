/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let service: SearchService;

  const mockSearchService = {
    search: jest.fn(),
    getSuggestions: jest.fn(),
    reindexAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should delegate search query to service', async () => {
      mockSearchService.search.mockResolvedValue({ posts: [] });

      const result = await controller.search('query', 'posts');

      expect(result).toEqual({ posts: [] });
      expect(service.search).toHaveBeenCalledWith('query', 'posts');
    });
  });

  describe('getSuggestions', () => {
    it('should delegate suggestions to service', async () => {
      mockSearchService.getSuggestions.mockResolvedValue({ suggestions: [] });

      const result = await controller.getSuggestions('query');

      expect(result).toEqual({ suggestions: [] });
      expect(service.getSuggestions).toHaveBeenCalledWith('query');
    });
  });

  describe('reindex', () => {
    it('should trigger full reindex', async () => {
      mockSearchService.reindexAll.mockResolvedValue({ postsIndexed: 10 });

      const result = await controller.reindex();

      expect(result).toEqual({ postsIndexed: 10 });
      expect(service.reindexAll).toHaveBeenCalled();
    });
  });
});

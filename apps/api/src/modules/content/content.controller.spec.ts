/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

describe('ContentController', () => {
  let controller: ContentController;
  let service: ContentService;

  const mockContentService = {
    getGlobalFeed: jest.fn(),
    createPost: jest.fn(),
    getPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    getPostComments: jest.fn(),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [
        {
          provide: ContentService,
          useValue: mockContentService,
        },
      ],
    }).compile();

    controller = module.get<ContentController>(ContentController);
    service = module.get<ContentService>(ContentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalFeed', () => {
    it('should delegate to service.getGlobalFeed', async () => {
      mockContentService.getGlobalFeed.mockResolvedValue([]);
      const result = await controller.getGlobalFeed();
      expect(result).toEqual([]);
      expect(service.getGlobalFeed).toHaveBeenCalled();
    });
  });

  describe('createPost', () => {
    it('should delegate to service.createPost', async () => {
      const dto = {
        title: 'DH Tech',
        content: 'Discussion on NestJS vs NextJS',
      };
      const req = { user: { userId: 'u1' } };
      mockContentService.createPost.mockResolvedValue({ id: 'p1', ...dto });

      const result = await controller.createPost(req, dto);

      expect(result.id).toEqual('p1');
      expect(service.createPost).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('getPost', () => {
    it('should delegate to service.getPost', async () => {
      const mockPost = { id: 'p1', title: 'DH Tech' };
      mockContentService.getPost.mockResolvedValue(mockPost);

      const result = await controller.getPost('p1', { headers: {} } as any);

      expect(result).toEqual(mockPost);
      expect(service.getPost).toHaveBeenCalledWith('p1', undefined);
    });
  });
});

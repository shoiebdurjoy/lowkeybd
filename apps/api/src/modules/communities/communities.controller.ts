import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Public } from '../../common/decorators/public.decorator';

interface RequestWithUser {
  user: {
    userId: string;
  };
  headers?: Record<string, string | undefined>;
}

@Controller('v1/communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Public()
  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Post()
  create(@Request() req: RequestWithUser, @Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(req.user.userId, dto);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string, @Request() req: RequestWithUser) {
    // Optionally extract userId from JWT token in authorization header if present
    const userId = this.extractUserId(req);
    return this.communitiesService.findOne(slug, userId);
  }

  @Patch(':slug')
  update(
    @Param('slug') slug: string,
    @Request() req: RequestWithUser,
    @Body() dto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(slug, req.user.userId, dto);
  }

  @Post(':slug/join')
  join(@Param('slug') slug: string, @Request() req: RequestWithUser) {
    return this.communitiesService.join(slug, req.user.userId);
  }

  @Post(':slug/leave')
  leave(@Param('slug') slug: string, @Request() req: RequestWithUser) {
    return this.communitiesService.leave(slug, req.user.userId);
  }

  @Public()
  @Get(':slug/posts')
  getPosts(@Param('slug') slug: string) {
    return this.communitiesService.getPosts(slug);
  }

  private extractUserId(req: RequestWithUser): string | undefined {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(
            Buffer.from(payloadBase64, 'base64').toString('utf-8'),
          ) as { sub: string };
          return decoded.sub;
        }
      } catch {
        // Silent catch for invalid/malformed tokens on public endpoints
      }
    }
    return undefined;
  }
}

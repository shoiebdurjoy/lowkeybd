import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Public } from '../../common/decorators/public.decorator';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { PostRestrictionGuard } from '../../common/guards/post-restriction.guard';

interface RequestWithUser {
  user: {
    userId: string;
  };
  headers?: Record<string, string | undefined>;
}

@Controller('v1')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ---- POSTS ----

  @Public()
  @Get('posts')
  getGlobalFeed() {
    return this.contentService.getGlobalFeed();
  }

  @UseGuards(EmailVerifiedGuard, PostRestrictionGuard)
  @Post('posts')
  createPost(@Request() req: RequestWithUser, @Body() dto: CreatePostDto) {
    return this.contentService.createPost(req.user.userId, dto);
  }

  @Public()
  @Get('posts/:id')
  getPost(@Param('id') id: string, @Request() req: RequestWithUser) {
    const userId = this.extractUserId(req);
    return this.contentService.getPost(id, userId);
  }

  @UseGuards(EmailVerifiedGuard)
  @Patch('posts/:id')
  updatePost(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.contentService.updatePost(id, req.user.userId, dto);
  }

  @UseGuards(EmailVerifiedGuard)
  @Delete('posts/:id')
  @HttpCode(HttpStatus.OK)
  deletePost(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.contentService.deletePost(id, req.user.userId);
  }

  @Public()
  @Get('posts/:id/comments')
  getPostComments(
    @Param('id') postId: string,
    @Request() req: RequestWithUser,
  ) {
    const userId = this.extractUserId(req);
    return this.contentService.getPostComments(postId, userId);
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

  // ---- COMMENTS ----

  @UseGuards(EmailVerifiedGuard)
  @Post('posts/:id/comments')
  createComment(
    @Request() req: RequestWithUser,
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.contentService.createComment(postId, req.user.userId, dto);
  }

  @UseGuards(EmailVerifiedGuard)
  @Patch('comments/:id')
  updateComment(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.contentService.updateComment(id, req.user.userId, dto);
  }

  @UseGuards(EmailVerifiedGuard)
  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  deleteComment(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.contentService.deleteComment(id, req.user.userId);
  }
}

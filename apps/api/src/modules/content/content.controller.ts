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
} from '@nestjs/common';
import { ContentService } from './content.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Public } from '../../common/decorators/public.decorator';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('v1')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ---- POSTS ----

  @Post('posts')
  createPost(@Request() req: RequestWithUser, @Body() dto: CreatePostDto) {
    return this.contentService.createPost(req.user.userId, dto);
  }

  @Public()
  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.contentService.getPost(id);
  }

  @Patch('posts/:id')
  updatePost(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.contentService.updatePost(id, req.user.userId, dto);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.OK)
  deletePost(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.contentService.deletePost(id, req.user.userId);
  }

  @Public()
  @Get('posts/:id/comments')
  getPostComments(@Param('id') postId: string) {
    return this.contentService.getPostComments(postId);
  }

  // ---- COMMENTS ----

  @Post('posts/:id/comments')
  createComment(
    @Request() req: RequestWithUser,
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.contentService.createComment(postId, req.user.userId, dto);
  }

  @Patch('comments/:id')
  updateComment(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.contentService.updateComment(id, req.user.userId, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  deleteComment(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.contentService.deleteComment(id, req.user.userId);
  }
}

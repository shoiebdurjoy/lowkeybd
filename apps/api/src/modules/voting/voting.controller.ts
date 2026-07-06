import { Controller, Post, Body, Param, Request } from '@nestjs/common';
import { VotingService } from './voting.service';
import { VoteDto } from './dto/vote.dto';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('v1')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Post('posts/:id/vote')
  votePost(
    @Request() req: RequestWithUser,
    @Param('id') postId: string,
    @Body() dto: VoteDto,
  ) {
    return this.votingService.votePost(req.user.userId, postId, dto.value);
  }

  @Post('comments/:id/vote')
  voteComment(
    @Request() req: RequestWithUser,
    @Param('id') commentId: string,
    @Body() dto: VoteDto,
  ) {
    return this.votingService.voteComment(
      req.user.userId,
      commentId,
      dto.value,
    );
  }
}

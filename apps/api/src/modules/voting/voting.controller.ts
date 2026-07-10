import {
  Controller,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { VotingService } from './voting.service';
import { VoteDto } from './dto/vote.dto';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { Throttle } from '@nestjs/throttler';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@UseGuards(EmailVerifiedGuard)
@Controller('v1')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('posts/:id/vote')
  votePost(
    @Request() req: RequestWithUser,
    @Param('id') postId: string,
    @Body() dto: VoteDto,
  ) {
    return this.votingService.votePost(req.user.userId, postId, dto.value);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
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

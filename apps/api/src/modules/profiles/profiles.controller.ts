import { Controller, Get, Patch, Param, Body, Request } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('v1')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Public()
  @Get('users/:username')
  getProfile(@Param('username') username: string) {
    return this.profilesService.getProfileByUsername(username);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Patch('me/profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(req.user.userId, dto);
  }

  @Get('me/activity')
  getMyActivity(@Request() req: RequestWithUser) {
    return this.profilesService.getMyActivity(req.user.userId);
  }
}

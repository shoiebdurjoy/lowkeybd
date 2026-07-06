import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Request() req: RequestWithUser) {
    return this.notificationsService.getNotifications(req.user.userId);
  }

  @Post('read-all')
  markAllAsRead(@Request() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Post(':id/read')
  async markAsRead(@Request() req: RequestWithUser, @Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(
      req.user.userId,
      id,
    );
    if (!result) {
      throw new NotFoundException('Notification not found or access denied');
    }
    return result;
  }

  @Get('preferences')
  getPreferences(@Request() req: RequestWithUser) {
    return this.notificationsService.getPreferences(req.user.userId);
  }

  @Patch('preferences')
  updatePreferences(@Request() req: RequestWithUser, @Body() dto: any) {
    return this.notificationsService.updatePreferences(req.user.userId, dto);
  }
}

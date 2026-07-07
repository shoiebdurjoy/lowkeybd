import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers({
      search,
      role,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() body: { role?: string; banned?: boolean; banReason?: string },
  ) {
    return this.adminService.updateUserStatus(id, req.user.userId, body);
  }

  @Get('feature-flags')
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Post('feature-flags')
  async createFeatureFlag(
    @Request() req: { user: { userId: string } },
    @Body() body: { key: string; description?: string; enabled?: boolean },
  ) {
    return this.adminService.createFeatureFlag(req.user.userId, body);
  }

  @Patch('feature-flags/:key')
  async updateFeatureFlag(
    @Param('key') key: string,
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      enabled?: boolean;
      rolloutPercentage?: number;
      description?: string;
    },
  ) {
    return this.adminService.updateFeatureFlag(key, req.user.userId, body);
  }
}

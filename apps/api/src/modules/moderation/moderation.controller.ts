import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { CreateModerationActionDto } from './dto/create-moderation-action.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // Any authenticated user can report content
  @Post('reports')
  async createReport(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createReport(req.user.userId, dto);
  }

  // Admin/Moderator: list reports
  @Get('admin/reports')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async getReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.moderationService.getReports({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // Admin/Moderator: resolve a report
  @Post('admin/reports/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async resolveReport(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: ResolveReportDto,
  ) {
    return this.moderationService.resolveReport(id, req.user.userId, dto);
  }

  // Admin/Moderator: take moderation action
  @Post('admin/moderation/actions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async createModerationAction(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateModerationActionDto,
  ) {
    return this.moderationService.createModerationAction(req.user.userId, dto);
  }
}

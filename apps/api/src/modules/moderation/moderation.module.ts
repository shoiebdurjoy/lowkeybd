import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ModerationController],
  providers: [ModerationService, PrismaService],
  exports: [ModerationService],
})
export class ModerationModule {}

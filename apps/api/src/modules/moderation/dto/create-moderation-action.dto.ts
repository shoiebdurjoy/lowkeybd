import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateModerationActionDto {
  @IsString()
  @IsNotEmpty()
  targetType!: string; // "post", "comment", "user"

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsString()
  @IsNotEmpty()
  actionType!: string; // "warn", "remove_content", "restrict", "ban", "unban"

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

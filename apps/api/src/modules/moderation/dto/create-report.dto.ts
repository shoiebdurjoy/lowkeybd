import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  targetType!: string; // "post", "comment", "user"

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

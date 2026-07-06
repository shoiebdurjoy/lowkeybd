import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { PostType } from '@repo/database';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(300)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50000)
  content?: string;

  @IsEnum(PostType)
  @IsOptional()
  type?: PostType;
}

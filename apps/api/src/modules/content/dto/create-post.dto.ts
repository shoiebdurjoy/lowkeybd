import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { PostType } from '@repo/database';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(50000)
  content: string;

  @IsEnum(PostType)
  @IsOptional()
  type?: PostType;

  @IsString()
  @IsOptional()
  @IsUUID()
  communityId?: string;
}

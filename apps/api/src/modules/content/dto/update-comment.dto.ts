import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  content?: string;
}

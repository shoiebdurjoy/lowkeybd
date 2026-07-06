import { IsString, MaxLength, IsOptional, IsUrl } from 'class-validator';

export class UpdateCommunityDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;
}

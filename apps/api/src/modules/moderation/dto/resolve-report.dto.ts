import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum ResolveAction {
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export class ResolveReportDto {
  @IsEnum(ResolveAction)
  @IsNotEmpty()
  action!: ResolveAction;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

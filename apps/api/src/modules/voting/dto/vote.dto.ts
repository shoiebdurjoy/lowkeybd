import { IsInt, IsIn } from 'class-validator';

export class VoteDto {
  @IsInt()
  @IsIn([-1, 0, 1])
  value: number;
}

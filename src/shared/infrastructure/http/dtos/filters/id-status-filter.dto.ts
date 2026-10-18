import { IsOptional, IsString } from 'class-validator';

export class IdStatusFilterDto {
  @IsOptional()
  @IsString()
  id_status?: string;
}

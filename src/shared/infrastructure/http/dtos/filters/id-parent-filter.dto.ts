import { IsOptional, IsString } from 'class-validator';

export class IdParentFilterDto {
  @IsOptional()
  @IsString()
  id_parent?: string;
}

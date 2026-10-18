import { IsOptional, IsString } from 'class-validator';

export class IdCountryFilterDto {
  @IsOptional()
  @IsString()
  id_country?: string;
}

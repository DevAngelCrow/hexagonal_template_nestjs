import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ConfirmEmailChangeQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'token' })
  token!: string;
}


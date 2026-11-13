import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({ example: 'user name' })
  user_name!: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({ example: 'password' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @ApiProperty({ required: false })
  turnstile_token?: string;
}

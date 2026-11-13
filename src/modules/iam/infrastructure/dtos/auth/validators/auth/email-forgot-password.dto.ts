import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class EmailForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'jhon_doe@mail.com' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @ApiProperty({ required: false })
  turnstile_token?: string;
}

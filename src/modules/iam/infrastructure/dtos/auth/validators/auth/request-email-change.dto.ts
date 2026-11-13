import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestEmailChangeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({ example: 'CurrentPass123!' })
  current_password!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({ example: 'new-email@example.com' })
  new_email!: string;
}


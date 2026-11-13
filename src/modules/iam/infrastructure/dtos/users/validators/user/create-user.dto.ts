import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsUUID(4)
  @IsNotEmpty()
  @ApiProperty({ example: 123 })
  id_people!: string;
  @IsString()
  @MaxLength(150)
  @IsNotEmpty()
  @ApiProperty({ example: 'johndoe' })
  user_name!: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(150)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must include at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  @ApiProperty({ example: 'SecureP@ss1' })
  password!: string;
  @IsUUID(4)
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  id_status!: string;
  @IsUUID(4)
  @IsOptional()
  @ApiProperty({ example: 10, required: false })
  id?: string;
}

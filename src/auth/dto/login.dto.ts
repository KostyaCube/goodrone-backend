import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from './register.dto';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto extends PartialType(RegisterDto) {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

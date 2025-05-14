import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(30)
  firstname: string;

  @IsString()
  @MinLength(2)
  @MaxLength(30)
  lastname: string;

  @MinLength(6)
  @MaxLength(20)
  password: string;
}

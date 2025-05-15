import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  signUp(@Body() RegisterDto: RegisterDto): Promise<{ token: string; user: User; }> {
    return this.authService.register(RegisterDto);
  }

  @Post('login')
  signIn(@Body() LoginDto: LoginDto): Promise<{ token: string; user: User; }> {
    return this.authService.login(LoginDto);
  }
}

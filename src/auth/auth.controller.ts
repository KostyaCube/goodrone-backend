import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  signUp(@Body() RegisterDto: RegisterDto): Promise<{ access_token: string }> {
    return this.authService.register(RegisterDto);
  }

  @Post('login')
  signIn(@Body() LoginDto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(LoginDto);
  }
}

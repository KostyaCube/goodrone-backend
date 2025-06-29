import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { API_MESSAGES } from 'src/constants/api-messages';
import { AuthResponse } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async signUp(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      return await this.authService.register(registerDto);
    } catch (err) {
      this.logger.error(`${API_MESSAGES.REGISTER_ERR}: ${err.message}`);
      if (err instanceof HttpException) throw err;
      throw new HttpException(API_MESSAGES.UNKNOWN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async signIn(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      return await this.authService.login(loginDto);
    } catch (err) {
      this.logger.error(`${API_MESSAGES.LOGIN_ERR}: ${err.message}`);
      if (err instanceof HttpException) throw err;
      throw new HttpException(API_MESSAGES.UNKNOWN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

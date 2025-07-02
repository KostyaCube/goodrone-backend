import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { API_MESSAGES } from 'src/constants/api-messages';
import { AuthResponse } from './jwt.strategy';
import { ProfileService } from 'src/profile/profile.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly profileService: ProfileService
  ) { }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userService.findOne({ email: dto.email });
    if (existingUser) {
      this.logger.warn(`${API_MESSAGES.USER_EXISTS}: ${dto.email}`);
      throw new ConflictException(API_MESSAGES.USER_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    try {
      await this.profileService.create({ userId: user.id });
    } catch (err) {
      this.logger.error(`${API_MESSAGES.FAIL_CREATING}:`, `${err.message}`);
    };

    if (!user) {
      this.logger.error(`${API_MESSAGES.UNKNOWN_ERROR}: ${dto.email}`);
      throw new InternalServerErrorException(API_MESSAGES.UNKNOWN_ERROR);
    }

    return this.generateToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findOne({ email: dto.email });

    if (!user) {
      this.logger.warn(`${API_MESSAGES.WRONG_CREDS}`);
      throw new UnauthorizedException(API_MESSAGES.WRONG_CREDS);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`${API_MESSAGES.WRONG_CREDS}`);
      throw new UnauthorizedException(API_MESSAGES.WRONG_CREDS);
    }

    return this.generateToken(user);
  }

  private generateToken(user: User): AuthResponse {
    const payload = { id: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return { token };
  }
}

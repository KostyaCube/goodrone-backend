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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto): Promise<{ token: string; user: User; }> {
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

    if (!user) {
      this.logger.error(`${API_MESSAGES.UNKNOWN_ERROR}: ${dto.email}`);
      throw new InternalServerErrorException(API_MESSAGES.UNKNOWN_ERROR);
    }

    return this.generateToken(user);
  }

  async login(dto: LoginDto): Promise<{ token: string; user: User; }> {
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

  private generateToken(user: User): { token: string; user: User; } {
    const payload = { id: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return { token, user };
  }
}

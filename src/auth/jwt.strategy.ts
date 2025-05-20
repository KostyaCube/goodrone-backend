import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface TokenPayload {
  id: number;
  email: string;
}

export interface AuthRequest extends Request {
  token: string;
  user: TokenPayload;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default_secret',
    });
  }

  async validate(payload: TokenPayload) {
    return payload;
  }
}

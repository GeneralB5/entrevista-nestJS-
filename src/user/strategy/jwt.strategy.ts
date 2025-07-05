import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("SECRET_JWT_KEY") ?? (()=>{throw new InternalServerErrorException("JWT Key no encontrada en el archivo .env")})()
      ,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email};
  }
}

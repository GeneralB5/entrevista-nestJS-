import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  CanActivate,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export function JwtAuthGuardFactory(cookieName: string, secretKey: string | undefined): Type<CanActivate> {
  @Injectable()
  class JwtAuthGuardWithCustomCookie implements CanActivate {
    constructor(private readonly jwtService: JwtService,private configService: ConfigService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req: Request = context.switchToHttp().getRequest();
      const token = req.cookies?.[cookieName];

      //Confirmamos la existencia del token y secret key
      if (!token) throw new UnauthorizedException(`Token no encontrado en la cookie "${cookieName}"`);
      if(!secretKey) throw new UnauthorizedException('Secret JWT no proporcionado o encontrado');
    
      try {
        const secret = this.configService.get<string>(secretKey) ?? (()=>{throw new UnauthorizedException("Secret JWT no encontrado")})();
        const payload = await this.jwtService.verifyAsync(token, { secret });

        // Guardamos el payload en req.user        
        req.user = payload;
      
        return true;
      } catch (err) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
    }
  }

  return JwtAuthGuardWithCustomCookie;
}

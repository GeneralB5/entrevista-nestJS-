import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports:[MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
   JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('SECRET_JWT_KEY'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '3600s' },
      }),
    })
  ],
  providers: [UserService,JwtStrategy],
  controllers: [UserController]
})
export class UserModule {}

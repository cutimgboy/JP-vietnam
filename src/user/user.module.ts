import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserEntity } from './entities/user.entity';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    UserService,
    AuthService,
    SmsService,
    EmailService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
  ],
  exports: [UserService, AuthService],
})
export class UserModule {}

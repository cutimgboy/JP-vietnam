import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 短信验证码登录
   * @param phone 手机号
   * @param code 验证码
   */
  async smsLogin(phone: string, code: string) {
    // 验证短信验证码
    await this.smsService.verifySms(phone, code);

    // 查找或创建用户
    let user = await this.userService.findByPhone(phone);
    if (!user) {
      user = await this.userService.create(phone);
    }

    // 验证用户状态
    const isValid = await this.userService.validateUserStatus(user);
    if (!isValid) {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 生成JWT令牌
    const token = await this.generateToken(user);

    return {
      token,
      userInfo: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }

  /**
   * 生成JWT令牌
   */
  private async generateToken(user: UserEntity): Promise<string> {
    const payload = {
      sub: user.id,
      phone: user.phone,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * 邮箱验证码登录
   * @param email 邮箱地址
   * @param code 验证码
   */
  async emailLogin(email: string, code: string) {
    // 验证邮箱验证码
    await this.emailService.verifyEmail(email, code);

    // 查找或创建用户
    let user = await this.userService.findByEmail(email);
    if (!user) {
      user = await this.userService.createByEmail(email);
    }

    // 验证用户状态
    const isValid = await this.userService.validateUserStatus(user);
    if (!isValid) {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 生成JWT令牌
    const token = await this.generateToken(user);

    return {
      token,
      userInfo: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }

  /**
   * 验证第三方登录（Google/Facebook）
   */
  async validateOAuthLogin(data: {
    provider: 'google' | 'facebook';
    providerId: string;
    email?: string;
    nickname: string;
    avatar?: string;
  }) {
    // 根据第三方平台 ID 查找用户
    let user: UserEntity | null = null;
    
    if (data.provider === 'google') {
      user = await this.userService.findByGoogleId(data.providerId);
    } else if (data.provider === 'facebook') {
      user = await this.userService.findByFacebookId(data.providerId);
    }

    // 如果用户不存在，创建新用户
    if (!user) {
      user = await this.userService.createByOAuth(data);
    }

    // 验证用户状态
    const isValid = await this.userService.validateUserStatus(user);
    if (!isValid) {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 生成 JWT 令牌
    const token = await this.generateToken(user);

    return {
      token,
      userInfo: {
        id: user.id,
        email: user.email ?? undefined,
        nickname: user.nickname ?? undefined,
        avatar: user.avatar ?? undefined,
      },
    };
  }

  /**
   * 验证JWT令牌
   */
  async validateToken(payload: any): Promise<UserEntity> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isValid = await this.userService.validateUserStatus(user);
    if (!isValid) {
      throw new UnauthorizedException('用户已被禁用');
    }

    return user;
  }
}

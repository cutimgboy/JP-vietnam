import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class EmailService {
  constructor(private redisService: RedisService) {}

  /**
   * 生成6位随机验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送邮箱验证码
   * @param email 邮箱地址
   */
  async sendEmail(email: string): Promise<void> {
    // 检查是否频繁发送
    const cacheKey = `email:${email}`;
    const existingCode = await this.redisService.get(cacheKey);

    if (existingCode) {
      throw new BadRequestException('验证码已发送，请稍后再试');
    }

    // 生成验证码
    const code = this.generateCode();

    // 这里集成真实的邮件服务商（如 Nodemailer、SendGrid 等）
    // 示例代码，实际需要替换为真实的邮件API调用
    console.log(`[邮件服务] 发送验证码到 ${email}: ${code}`);

    // TODO: 调用真实邮件API
    // await this.sendEmailToProvider(email, code);

    // 将验证码存入缓存，有效期5分钟（300秒）
    await this.redisService.set(cacheKey, code, 300);
  }

  /**
   * 验证邮箱验证码
   * @param email 邮箱地址
   * @param code 验证码
   */
  async verifyEmail(email: string, code: string): Promise<boolean> {
    const cacheKey = `email:${email}`;
    const cachedCode = await this.redisService.get(cacheKey);

    if (!cachedCode) {
      throw new BadRequestException('验证码已过期或不存在');
    }

    if (cachedCode !== code) {
      throw new BadRequestException('验证码错误');
    }

    // 验证成功后删除验证码
    await this.redisService.del(cacheKey);
    return true;
  }

  /**
   * 调用第三方邮件服务商发送邮件（示例）
   * 实际使用时需要替换为真实的邮件服务商SDK
   */
  private async sendEmailToProvider(email: string, code: string): Promise<void> {
    // 示例：使用 Nodemailer
    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.example.com',
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: 'your-email@example.com',
    //     pass: 'your-password'
    //   }
    // });
    //
    // await transporter.sendMail({
    //   from: '"Your App" <noreply@example.com>',
    //   to: email,
    //   subject: '登录验证码',
    //   html: `<p>您的验证码是：<strong>${code}</strong>，有效期5分钟。</p>`
    // });
  }
}
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class SmsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * 生成6位随机验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送短信验证码
   * @param phone 手机号
   */
  async sendSms(phone: string): Promise<void> {
    // 检查是否频繁发送
    const cacheKey = `sms:${phone}`;
    const existingCode = await this.cacheManager.get(cacheKey);

    if (existingCode) {
      throw new BadRequestException('验证码已发送，请稍后再试');
    }

    // 生成验证码
    const code = this.generateCode();

    // 这里集成真实的短信服务商（如阿里云、腾讯云等）
    // 示例代码，实际需要替换为真实的短信API调用
    console.log(`[短信服务] 发送验证码到 ${phone}: ${code}`);

    // TODO: 调用真实短信API
    // await this.sendSmsToProvider(phone, code);

    // 将验证码存入缓存，有效期5分钟
    await this.cacheManager.set(cacheKey, code, 300000);
  }

  /**
   * 验证短信验证码
   * @param phone 手机号
   * @param code 验证码
   */
  async verifySms(phone: string, code: string): Promise<boolean> {
    const cacheKey = `sms:${phone}`;
    const cachedCode = await this.cacheManager.get<string>(cacheKey);

    if (!cachedCode) {
      throw new BadRequestException('验证码已过期或不存在');
    }

    if (cachedCode !== code) {
      throw new BadRequestException('验证码错误');
    }

    // 验证成功后删除验证码
    await this.cacheManager.del(cacheKey);
    return true;
  }

  /**
   * 调用第三方短信服务商发送短信（示例）
   * 实际使用时需要替换为真实的短信服务商SDK
   */
  private async sendSmsToProvider(phone: string, code: string): Promise<void> {
    // 示例：阿里云短信服务
    // const client = new AliSmsClient(config);
    // await client.sendSms({
    //   phoneNumbers: phone,
    //   signName: '您的签名',
    //   templateCode: 'SMS_123456',
    //   templateParam: JSON.stringify({ code })
    // });
  }
}

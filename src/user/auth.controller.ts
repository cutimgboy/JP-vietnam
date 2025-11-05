import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { SmsLoginDto } from './dto/sms-login.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  @Public()
  @Post('send-sms')
  @ApiOperation({ summary: '发送短信验证码' })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    const code = await this.smsService.sendSms(sendSmsDto.phone);
    return {
      message: '验证码已发送',
      code: code
    };
  }

  @Public()
  @Post('sms-login')
  @ApiOperation({ summary: '短信验证码登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async smsLogin(@Body() smsLoginDto: SmsLoginDto) {
    const result = await this.authService.smsLogin(
      smsLoginDto.phone,
      smsLoginDto.code,
    );
    return {
      message: '登录成功',
      data: result,
    };
  }

  @Public()
  @Post('send-email')
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    await this.emailService.sendEmail(sendEmailDto.email);
    return {
      message: '验证码已发送',
    };
  }

  @Public()
  @Post('email-login')
  @ApiOperation({ summary: '邮箱验证码登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async emailLogin(@Body() emailLoginDto: EmailLoginDto) {
    const result = await this.authService.emailLogin(
      emailLoginDto.email,
      emailLoginDto.code,
    );
    return {
      message: '登录成功',
      data: result,
    };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 登录' })
  @ApiResponse({ status: 302, description: '重定向到 Google 授权页面' })
  async googleLogin() {
    // 此方法会自动重定向到 Google 授权页面
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 登录回调' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async googleCallback(@Req() req, @Res() res) {
    const result = req.user;
    // 重定向到前端页面，携带 token
    return res.redirect(`http://localhost:3001/auth/callback?token=${result.token}`);
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook 登录' })
  @ApiResponse({ status: 302, description: '重定向到 Facebook 授权页面' })
  async facebookLogin() {
    // 此方法会自动重定向到 Facebook 授权页面
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook 登录回调' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async facebookCallback(@Req() req, @Res() res) {
    const result = req.user;
    // 重定向到前端页面，携带 token
    return res.redirect(`http://localhost:3001/auth/callback?token=${result.token}`);
  }
}

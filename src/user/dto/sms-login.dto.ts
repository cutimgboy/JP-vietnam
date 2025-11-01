import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class SmsLoginDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString()
  @Length(6, 6, { message: '验证码长度必须为6位' })
  code: string;
}

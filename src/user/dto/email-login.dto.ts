import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, Length } from 'class-validator';

export class EmailLoginDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString()
  @Length(6, 6, { message: '验证码长度必须为6位' })
  code: string;
}

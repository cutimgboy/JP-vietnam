import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前登录用户的装饰器
 * 从请求对象中提取经过 JWT 验证后的用户信息
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

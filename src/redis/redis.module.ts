import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global() // 全局模块，无需在其他模块重复导入
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService], // 导出供其他模块使用
})
export class RedisModule {}
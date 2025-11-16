import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    // 从环境变量配置 Redis 连接
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get('REDIS_PASSWORD'), // 可选密码
      db: this.configService.get<number>('REDIS_DB') || 0,
    });

    // 连接成功日志
    this.redisClient.on('connect', () => {
      console.log('✅ Redis 连接成功');
    });

    // 连接错误日志
    this.redisClient.on('error', (err) => {
      console.error('❌ Redis 连接失败:', err);
    });
  }

  /**
   * 获取 Redis 中的键值
   * @param key 键名
   * @returns 键值或 null
   */
  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  /**
   * 设置 Redis 键值
   * @param key 键名
   * @param value 值
   * @param ttl 过期时间（秒），可选
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  /**
   * 删除 Redis 中的键
   * @param key 键名
   */
  async del(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }

  /**
   * 检查键是否存在
   * @param key 键名
   * @returns 1 存在，0 不存在
   */
  async exists(key: string): Promise<number> {
    return await this.redisClient.exists(key);
  }

  /**
   * 设置键的过期时间
   * @param key 键名
   * @param seconds 过期秒数
   */
  async expire(key: string, seconds: number): Promise<number> {
    return await this.redisClient.expire(key, seconds);
  }

  /**
   * 获取键的剩余过期时间
   * @param key 键名
   * @returns 剩余秒数，-1 表示永不过期，-2 表示键不存在
   */
  async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  /**
   * 获取原始 Redis 客户端（用于高级操作）
   */
  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * 模块销毁时关闭 Redis 连接
   */
  async onModuleDestroy() {
    await this.redisClient.quit();
    console.log('?? Redis 连接已关闭');
  }
}
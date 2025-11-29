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
   * 批量获取股票行情数据
   * @param codes 股票代码列表
   * @returns 股票行情数据数组
   */
  async getBatchStockQuotes(codes: string[]): Promise<any[]> {
    try {
      const pipeline = this.redisClient.pipeline();
      
      codes.forEach(code => {
        pipeline.get(`stock:quote:${code}`);
      });

      const results = await pipeline.exec();
      const quotes: any[] = [];

      results?.forEach(([err, data]) => {
        if (!err && data) {
          const quoteData = JSON.parse(data as string);
          quotes.push({
            code: quoteData.code,
            buy_price: quoteData.buy_price,
            sale_price: quoteData.sale_price,
          });
        }
      });

      return quotes;
    } catch (error) {
      console.error('批量获取股票行情失败:', error);
      return [];
    }
  }

  /**
   * 设置单个股票行情数据
   * @param code 股票代码
   * @param quoteData 行情数据
   * @param ttl 过期时间（秒），默认60秒
   */
  async setStockQuote(code: string, quoteData: any, ttl: number = 60): Promise<void> {
    try {
      const key = `stock:quote:${code}`;
      await this.redisClient.setex(key, ttl, JSON.stringify(quoteData));
    } catch (error) {
      console.error(`设置股票行情失败 ${code}:`, error);
      throw error;
    }
  }

  /**
   * 获取单个股票行情数据
   * @param code 股票代码
   * @returns 股票行情数据或null
   */
  async getStockQuote(code: string): Promise<any | null> {
    try {
      const data = await this.redisClient.get(`stock:quote:${code}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`获取股票行情失败 ${code}:`, error);
      return null;
    }
  }

  /**
   * 设置所有股票汇总数据
   * @param allQuotesData 所有股票汇总数据
   * @param ttl 过期时间（秒），默认2秒
   */
  async setAllQuotes(allQuotesData: any, ttl: number = 2): Promise<void> {
    try {
      await this.redisClient.setex('stock:quotes:all', ttl, JSON.stringify(allQuotesData));
    } catch (error) {
      console.error('设置所有股票汇总数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有股票汇总数据
   * @returns 所有股票汇总数据或null
   */
  async getAllQuotes(): Promise<any | null> {
    try {
      const data = await this.redisClient.get('stock:quotes:all');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('获取所有股票汇总数据失败:', error);
      return null;
    }
  }

  /**
   * 设置股票价格缓存
   * @param code 股票代码
   * @param price 价格
   * @param ttl 过期时间（秒），默认60秒
   */
  async setStockPrice(code: string, price: number, ttl: number = 60): Promise<void> {
    try {
      const key = `stock:price:${code}`;
      await this.redisClient.setex(key, ttl, price.toString());
    } catch (error) {
      console.error(`设置股票价格失败 ${code}:`, error);
      throw error;
    }
  }

  /**
   * 获取股票价格缓存
   * @param code 股票代码
   * @returns 价格或null
   */
  async getStockPrice(code: string): Promise<number | null> {
    try {
      const data = await this.redisClient.get(`stock:price:${code}`);
      return data ? parseFloat(data) : null;
    } catch (error) {
      console.error(`获取股票价格失败 ${code}:`, error);
      return null;
    }
  }

  /**
   * 设置价差设置缓存
   * @param code 股票代码
   * @param spreadData 价差数据
   * @param ttl 过期时间（秒），默认300秒
   */
  async setStockSpread(code: string, spreadData: any, ttl: number = 300): Promise<void> {
    try {
      const key = `stock:spread:${code}`;
      await this.redisClient.setex(key, ttl, JSON.stringify(spreadData));
    } catch (error) {
      console.error(`设置价差设置失败 ${code}:`, error);
      throw error;
    }
  }

  /**
   * 获取价差设置缓存
   * @param code 股票代码
   * @returns 价差数据或null
   */
  async getStockSpread(code: string): Promise<any | null> {
    try {
      const data = await this.redisClient.get(`stock:spread:${code}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`获取价差设置失败 ${code}:`, error);
      return null;
    }
  }

  /**
   * 清理过期的缓存数据
   * @param pattern 键模式，如 'stock:*'
   */
  async cleanExpiredCache(pattern: string = 'stock:*'): Promise<number> {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      let deletedCount = 0;
      for (const key of keys) {
        const ttl = await this.redisClient.ttl(key);
        if (ttl === -1) {
          // 没有设置过期时间的键，设置一个较短的过期时间
          await this.redisClient.expire(key, 60);
        } else if (ttl === -2) {
          // 已过期的键，删除
          await this.redisClient.del(key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      return 0;
    }
  }

  /**
   * 获取缓存统计信息
   * @param pattern 键模式
   * @returns 缓存统计信息
   */
  async getCacheStats(pattern: string = 'stock:*'): Promise<any> {
    try {
      const keys = await this.redisClient.keys(pattern);
      const stats = {
        totalKeys: keys.length,
        keysWithTTL: 0,
        keysWithoutTTL: 0,
        expiredKeys: 0,
        memoryUsage: 0,
      };

      for (const key of keys) {
        const ttl = await this.redisClient.ttl(key);
        if (ttl === -1) {
          stats.keysWithoutTTL++;
        } else if (ttl === -2) {
          stats.expiredKeys++;
        } else {
          stats.keysWithTTL++;
        }

        // 获取内存使用情况（需要Redis 4.0+）
        try {
          const memory = await this.redisClient.memory('USAGE', key);
          if (memory !== null) {
            stats.memoryUsage += memory;
          }
        } catch (e) {
          // 如果Redis版本不支持memory命令，忽略错误
        }
      }

      return stats;
    } catch (error) {
      console.error('获取缓存统计信息失败:', error);
      return null;
    }
  }

  /**
   * 批量设置缓存（使用Pipeline提高性能）
   * @param operations 操作数组，格式: [{key, value, ttl}, ...]
   */
  async batchSet(operations: Array<{key: string, value: string, ttl?: number}>): Promise<void> {
    try {
      const pipeline = this.redisClient.pipeline();
      
      operations.forEach(({key, value, ttl}) => {
        if (ttl) {
          pipeline.setex(key, ttl, value);
        } else {
          pipeline.set(key, value);
        }
      });

      await pipeline.exec();
    } catch (error) {
      console.error('批量设置缓存失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取缓存（使用Pipeline提高性能）
   * @param keys 键名数组
   * @returns 键值对数组
   */
  async batchGet(keys: string[]): Promise<Array<string | null>> {
    try {
      const pipeline = this.redisClient.pipeline();
      
      keys.forEach(key => {
        pipeline.get(key);
      });

      const results = await pipeline.exec();
      return results?.map(([, data]) => data as string | null) || [];
    } catch (error) {
      console.error('批量获取缓存失败:', error);
      return [];
    }
  }

  /**
   * 模块销毁时关闭 Redis 连接
   */
  async onModuleDestroy() {
    await this.redisClient.quit();
    console.log('✅ Redis 连接已关闭');
  }
}
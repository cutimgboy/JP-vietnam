# Redis 模块使用说明

## 📦 模块概述

这是一个独立的 Redis 模块，基于 `ioredis` 封装，可以被项目中的任何模块复用。

## 🚀 特性

- ✅ **全局模块**：使用 `@Global()` 装饰器，无需在其他模块重复导入
- ✅ **配置灵活**：通过环境变量配置 Redis 连接信息
- ✅ **自动重连**：连接断开时自动重连
- ✅ **生命周期管理**：应用关闭时自动断开连接
- ✅ **完整 API**：提供常用的 Redis 操作方法

## 📝 环境变量配置

在 `.env.dev` 或 `.env.prod` 中配置：

```bash
# Redis 配置
REDIS_HOST=localhost        # Redis 服务器地址
REDIS_PORT=6379            # Redis 端口
# REDIS_PASSWORD=          # Redis 密码（可选）
REDIS_DB=0                 # 数据库编号（默认 0）
```

## 💡 使用方法

### 1. 在模块中注入（自动可用）

由于 RedisModule 是全局模块，无需在其他模块的 `imports` 中导入。

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class YourService {
  constructor(private redisService: RedisService) {}

  async yourMethod() {
    // 直接使用 redisService
    await this.redisService.set('key', 'value', 300);
  }
}
```

### 2. API 方法

#### 基础操作

```typescript
// 设置键值（带过期时间）
await redisService.set('key', 'value', 300); // 300秒后过期

// 设置键值（永不过期）
await redisService.set('key', 'value');

// 获取键值
const value = await redisService.get('key'); // 返回 string | null

// 删除键
await redisService.del('key'); // 返回删除的键数量
```

#### 高级操作

```typescript
// 检查键是否存在
const exists = await redisService.exists('key'); // 1存在，0不存在

// 设置过期时间
await redisService.expire('key', 600); // 设置为600秒后过期

// 获取剩余过期时间
const ttl = await redisService.ttl('key'); // 返回剩余秒数
// -1: 永不过期
// -2: 键不存在
```

#### 获取原始客户端（高级用户）

```typescript
const client = redisService.getClient();
// 可以使用 ioredis 的所有原生方法
await client.hset('hash_key', 'field', 'value');
```

## 📚 使用示例

### 示例 1：短信验证码

```typescript
@Injectable()
export class SmsService {
  constructor(private redisService: RedisService) {}

  async sendSms(phone: string): Promise<void> {
    const code = this.generateCode();
    const key = `sms:${phone}`;
    
    // 存储验证码，5分钟过期
    await this.redisService.set(key, code, 300);
  }

  async verifySms(phone: string, code: string): Promise<boolean> {
    const key = `sms:${phone}`;
    const savedCode = await this.redisService.get(key);
    
    if (savedCode === code) {
      await this.redisService.del(key); // 验证后删除
      return true;
    }
    return false;
  }
}
```

### 示例 2：用户会话缓存

```typescript
@Injectable()
export class SessionService {
  constructor(private redisService: RedisService) {}

  async setSession(userId: string, sessionData: any): Promise<void> {
    const key = `session:${userId}`;
    const value = JSON.stringify(sessionData);
    
    // 会话24小时过期
    await this.redisService.set(key, value, 86400);
  }

  async getSession(userId: string): Promise<any> {
    const key = `session:${userId}`;
    const value = await this.redisService.get(key);
    
    return value ? JSON.parse(value) : null;
  }
}
```

### 示例 3：API 限流

```typescript
@Injectable()
export class RateLimitService {
  constructor(private redisService: RedisService) {}

  async checkLimit(ip: string, limit: number = 100): Promise<boolean> {
    const key = `rate:${ip}`;
    const current = await this.redisService.get(key);
    
    if (!current) {
      // 首次访问，设置计数器，1分钟过期
      await this.redisService.set(key, '1', 60);
      return true;
    }
    
    const count = parseInt(current);
    if (count >= limit) {
      return false; // 超过限制
    }
    
    // 增加计数
    const client = this.redisService.getClient();
    await client.incr(key);
    return true;
  }
}
```

## 🔧 架构优势

### 解耦设计

```
┌─────────────────┐
│   AppModule     │
├─────────────────┤
│ ┌─────────────┐ │
│ │RedisModule  │ │ ← 全局模块
│ │(Global)     │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ UserModule  │ │ → 直接注入 RedisService
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ PostsModule │ │ → 直接注入 RedisService
│ └─────────────┘ │
└─────────────────┘
```

### 与 cache-manager 对比

| 特性 | RedisModule | cache-manager |
|-----|-------------|---------------|
| **独立性** | ✅ 完全独立模块 | ❌ 耦合在业务模块 |
| **复用性** | ✅ 全局可用 | ❌ 需要每个模块导入 |
| **功能性** | ✅ 完整 Redis API | ⚠️ 有限的缓存 API |
| **灵活性** | ✅ 可访问原始客户端 | ❌ 封装层限制 |
| **类型安全** | ✅ 完整 TypeScript 支持 | ⚠️ 泛型支持有限 |

## 🎯 最佳实践

1. **键名规范**：使用命名空间前缀
   ```typescript
   `sms:${phone}`      // 短信验证码
   `email:${email}`    // 邮箱验证码
   `session:${userId}` // 用户会话
   ```

2. **始终设置过期时间**：避免内存泄漏
   ```typescript
   await redisService.set(key, value, 300); // ✅ 推荐
   await redisService.set(key, value);      // ⚠️ 谨慎使用
   ```

3. **错误处理**：Redis 操作可能失败
   ```typescript
   try {
     await redisService.set(key, value);
   } catch (error) {
     console.error('Redis 操作失败:', error);
     // 降级处理
   }
   ```

4. **JSON 序列化**：存储复杂对象
   ```typescript
   const data = { user: 'John', age: 30 };
   await redisService.set(key, JSON.stringify(data));
   const stored = await redisService.get(key);
   const parsed = stored ? JSON.parse(stored) : null;
   ```

## 📊 监控与调试

Redis 连接状态会自动打印日志：

```
✅ Redis 连接成功
❌ Redis 连接失败: [错误信息]
🔌 Redis 连接已关闭
```

## 🔗 相关文档

- [ioredis 官方文档](https://github.com/redis/ioredis)
- [Redis 命令参考](https://redis.io/commands/)
- [NestJS 模块文档](https://docs.nestjs.com/modules)
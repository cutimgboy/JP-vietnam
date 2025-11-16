# WebSocket 实时行情模块使用说明

## 📦 模块概述

WebSocket 实时行情模块用于订阅和接收股票、外汇、加密货币的实时行情数据。基于 alltick.co 行情数据源实现。

## 🏗️ 架构设计

```
外部行情源 (alltick.co)
    ↓ WebSocket 连接
QuoteService (服务层)
    ↓ 数据转发
QuoteGateway (网关层)
    ↓ Socket.IO
前端客户端 (浏览器/App)
```

### 核心组件

1. **QuoteService** - 管理与外部行情源的 WebSocket 连接
   - 连接管理（连接、断开、重连）
   - 订阅管理（订阅、取消订阅）
   - 心跳维护
   - 消息分发

2. **QuoteGateway** - 处理客户端连接
   - 接收客户端订阅请求
   - 转发行情数据给客户端
   - 管理客户端连接状态

## 🚀 快速开始

### 1. 配置 Token

在 `.env.dev` 或 `.env.prod` 中配置 alltick.co 的 Token：

```bash
# WebSocket 行情源配置
QUOTE_WS_TOKEN=your-token-here  # 替换为您的实际 Token
```

**申请 Token：** https://alltick.co

### 2. 启动应用

```bash
npm run start:dev
```

WebSocket 服务会在应用启动时自动初始化。

### 3. 客户端连接

**连接地址：** `ws://localhost:3000/quote`

---

## 💻 客户端使用示例

### JavaScript/TypeScript

```typescript
import { io } from 'socket.io-client';

// 连接到 WebSocket 服务
const socket = io('http://localhost:3000/quote', {
  transports: ['websocket'],
});

// 监听连接状态
socket.on('connection-status', (data) => {
  console.log('连接状态:', data);
  // { status: 'connected', message: '连接成功', timestamp: '...' }
});

// 订阅股票行情
socket.emit('subscribe', {
  symbols: ['700.HK', 'AAPL.US'],
  depthLevel: 5, // 可选，默认5
});

// 监听订阅成功
socket.on('subscribe-success', (data) => {
  console.log('订阅成功:', data);
  // { message: '成功订阅 2 个股票', symbols: ['700.HK', 'AAPL.US'] }
});

// 接收实时行情数据
socket.on('quote-data', (data) => {
  console.log('收到行情数据:', data);
  // 实时行情数据会持续推送
});

// 取消订阅
socket.emit('unsubscribe', {
  symbols: ['700.HK'],
});

// 监听取消订阅成功
socket.on('unsubscribe-success', (data) => {
  console.log('取消订阅成功:', data);
});

// 获取连接状态
socket.emit('get-status');

// 监听状态信息
socket.on('status-info', (data) => {
  console.log('状态信息:', data);
  // {
  //   connectionStatus: 'OPEN',
  //   subscribedSymbols: ['700.HK', 'AAPL.US'],
  //   timestamp: '...'
  // }
});

// 监听错误
socket.on('error', (data) => {
  console.error('错误:', data);
});
```

### Vue 3 示例

```vue
<template>
  <div>
    <h2>实时行情</h2>
    <div>连接状态: {{ connectionStatus }}</div>
    
    <div>
      <input v-model="symbol" placeholder="输入股票代码，如 AAPL.US" />
      <button @click="subscribe">订阅</button>
      <button @click="unsubscribe">取消订阅</button>
    </div>

    <div v-for="quote in quotes" :key="quote.code">
      {{ quote.code }}: {{ quote.price }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const socket = ref(null);
const connectionStatus = ref('未连接');
const symbol = ref('');
const quotes = ref([]);

onMounted(() => {
  // 连接 WebSocket
  socket.value = io('http://localhost:3000/quote');

  socket.value.on('connection-status', (data) => {
    connectionStatus.value = data.status;
  });

  socket.value.on('quote-data', (data) => {
    // 处理行情数据
    console.log('行情数据:', data);
    // 更新 UI
  });
});

onUnmounted(() => {
  socket.value?.disconnect();
});

const subscribe = () => {
  if (!symbol.value) return;
  socket.value.emit('subscribe', {
    symbols: [symbol.value],
    depthLevel: 5,
  });
};

const unsubscribe = () => {
  if (!symbol.value) return;
  socket.value.emit('unsubscribe', {
    symbols: [symbol.value],
  });
};
</script>
```

---

## 📡 消息协议

### 客户端 → 服务端

#### 1. 订阅行情

```javascript
socket.emit('subscribe', {
  symbols: ['700.HK', 'AAPL.US'],  // 股票代码列表
  depthLevel: 5                     // 深度档位 (1-5)，可选
});
```

#### 2. 取消订阅

```javascript
socket.emit('unsubscribe', {
  symbols: ['700.HK']  // 要取消订阅的股票代码
});
```

#### 3. 获取状态

```javascript
socket.emit('get-status');
```

### 服务端 → 客户端

#### 1. 连接状态

```javascript
socket.on('connection-status', (data) => {
  // { status: 'connected', message: '连接成功', timestamp: '...' }
});
```

#### 2. 订阅成功

```javascript
socket.on('subscribe-success', (data) => {
  // { message: '成功订阅 2 个股票', symbols: [...] }
});
```

#### 3. 取消订阅成功

```javascript
socket.on('unsubscribe-success', (data) => {
  // { message: '成功取消订阅 1 个股票', symbols: [...] }
});
```

#### 4. 实时行情数据

```javascript
socket.on('quote-data', (data) => {
  // alltick.co 返回的实时行情数据
  // 数据格式参考: https://github.com/alltick/realtime-forex-crypto-stock-tick-finance-websocket-api
});
```

#### 5. 状态信息

```javascript
socket.on('status-info', (data) => {
  // {
  //   connectionStatus: 'OPEN',
  //   subscribedSymbols: ['700.HK', 'AAPL.US'],
  //   timestamp: '...'
  // }
});
```

#### 6. 错误信息

```javascript
socket.on('error', (data) => {
  // { message: '错误描述' }
});
```

---

## 🔧 核心特性

### 1. 自动重连

连接断开后自动在 5 秒后重连，并重新订阅之前的股票。

### 2. 心跳机制

每 30 秒发送一次心跳，保持连接活跃。

### 3. 订阅管理

- 支持动态订阅/取消订阅
- 重连后自动恢复订阅
- 记录所有订阅的股票代码

### 4. 消息广播

所有连接的客户端都能接收到行情数据。

---

## 📝 股票代码格式

根据 alltick.co 的要求，股票代码格式为：

| 市场 | 格式 | 示例 |
|-----|------|------|
| 香港 | `代码.HK` | `700.HK`（腾讯）|
| 美股 | `代码.US` | `AAPL.US`（苹果）|
| A股 | `代码.SH/SZ` | `600000.SH`（浦发银行）|

**注意：** 不同的 WebSocket API 地址支持不同的市场：

- **股票 API**：`wss://quote.alltick.co/quote-stock-b-ws-api`
- **外汇/加密货币 API**：`wss://quote.alltick.co/quote-b-ws-api`

当前实现使用的是**股票 API**。

---

## 🛠️ 高级用法

### 在服务中使用 QuoteService

```typescript
import { Injectable } from '@nestjs/common';
import { QuoteService } from '../quote/quote.service';

@Injectable()
export class TradingService {
  constructor(private quoteService: QuoteService) {}

  async startMonitoring() {
    // 连接行情源
    await this.quoteService.connect();

    // 订阅股票
    this.quoteService.subscribe(['AAPL.US', '700.HK']);

    // 监听行情数据
    this.quoteService.onMessage((data) => {
      console.log('收到行情:', data);
      // 处理行情数据，如存储到 Redis、触发交易逻辑等
    });
  }

  async stopMonitoring() {
    // 取消订阅
    this.quoteService.unsubscribe(['AAPL.US', '700.HK']);
    
    // 断开连接
    this.quoteService.disconnect();
  }
}
```

---

## ⚙️ 配置说明

### 修改行情源地址

如需订阅外汇、加密货币，修改 `src/quote/quote.service.ts`：

```typescript
// 外汇、加密货币 API
const url = `wss://quote.alltick.co/quote-b-ws-api?token=${token}`;

// 股票 API（当前使用）
const url = `wss://quote.alltick.co/quote-stock-b-ws-api?token=${token}`;
```

### 调整心跳和重连间隔

在 `QuoteService` 构造函数中：

```typescript
private readonly reconnectInterval = 5000;  // 重连间隔（毫秒）
private readonly heartbeatInterval = 30000; // 心跳间隔（毫秒）
```

---

## 🧪 测试

### 使用 Socket.IO 客户端测试

```bash
npm install socket.io-client -g

# 或使用在线工具
# https://amritb.github.io/socketio-client-tool/
```

**测试代码：**

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000/quote');

socket.on('connect', () => {
  console.log('✅ 已连接');
  
  // 订阅
  socket.emit('subscribe', {
    symbols: ['700.HK', 'AAPL.US'],
    depthLevel: 5,
  });
});

socket.on('quote-data', (data) => {
  console.log('📊 行情数据:', data);
});

socket.on('error', (err) => {
  console.error('❌ 错误:', err);
});
```

---

## 📊 行情数据格式

根据 alltick.co 的 API 文档，行情数据可能包含：

```json
{
  "cmd_id": 22002,
  "data": {
    "code": "AAPL.US",
    "price": 150.25,
    "volume": 1000,
    "bid": [
      { "price": 150.24, "volume": 100 },
      { "price": 150.23, "volume": 200 }
    ],
    "ask": [
      { "price": 150.25, "volume": 150 },
      { "price": 150.26, "volume": 250 }
    ],
    "timestamp": 1678419657806
  }
}
```

**详细格式请参考：** https://github.com/alltick/realtime-forex-crypto-stock-tick-finance-websocket-api

---

## 🔐 安全建议

1. **生产环境**
   - 使用真实 Token 替换 `testtoken`
   - 限制 CORS 来源
   - 添加客户端认证

2. **性能优化**
   - 限制每个客户端的订阅数量
   - 使用 Redis 缓存行情数据
   - 对高频数据进行节流处理

3. **错误处理**
   - 监控连接状态
   - 记录异常日志
   - 实现降级策略

---

## 📚 相关文档

- [alltick.co API 文档](https://github.com/alltick/realtime-forex-crypto-stock-tick-finance-websocket-api)
- [NestJS WebSocket 文档](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO 客户端文档](https://socket.io/docs/v4/client-api/)
- [ws 库文档](https://github.com/websockets/ws)

---

## 🎯 使用场景

1. **实时行情展示**
   - K线图实时更新
   - 价格跳动展示
   - 深度行情显示

2. **交易监控**
   - 价格预警
   - 自动交易触发
   - 风险监控

3. **数据分析**
   - 实时数据采集
   - 历史数据回放
   - 量化分析

---

## ⚡ 性能特点

- ✅ 自动重连机制
- ✅ 心跳保活
- ✅ 订阅状态管理
- ✅ 广播式数据分发
- ✅ 支持多客户端并发连接
# WebSocket 实时行情 API 文档

## 📡 连接信息

### WebSocket 服务地址

```
ws://localhost:3000/quote
```

**协议：** Socket.IO  
**命名空间：** `/quote`  
**认证要求：** 无（已关闭全局认证）

---

## 🔌 客户端集成

### 1. 安装依赖

```bash
npm install socket.io-client
```

### 2. 基础连接示例

```typescript
import { io } from 'socket.io-client';

// 连接到 WebSocket 服务
const socket = io('http://localhost:3000/quote', {
  transports: ['websocket'],
});

// 监听连接成功
socket.on('connect', () => {
  console.log('✅ 已连接到行情服务');
});

// 监听断开连接
socket.on('disconnect', () => {
  console.log('❌ 已断开连接');
});
```

---

## 📨 消息协议

### 客户端发送消息

#### 1. 订阅股票行情

**事件名：** `subscribe`

**参数格式：**
```typescript
{
  symbols: string[];      // 股票代码列表，如 ['700.HK', 'AAPL.US']
  depthLevel?: number;    // 深度档位 (1-5)，默认 5
}
```

**代码示例：**
```typescript
socket.emit('subscribe', {
  symbols: ['700.HK', 'AAPL.US'],
  depthLevel: 5,
});
```

#### 2. 取消订阅

**事件名：** `unsubscribe`

**参数格式：**
```typescript
{
  symbols: string[];  // 要取消订阅的股票代码列表
}
```

**代码示例：**
```typescript
socket.emit('unsubscribe', {
  symbols: ['700.HK'],
});
```

#### 3. 获取连接状态

**事件名：** `get-status`

**参数：** 无

**代码示例：**
```typescript
socket.emit('get-status');
```

---

### 服务端推送消息

#### 1. 连接状态通知

**事件名：** `connection-status`

**数据格式：**
```typescript
{
  status: 'connected';
  message: '连接成功';
  timestamp: string;  // ISO 8601 格式时间
}
```

**监听示例：**
```typescript
socket.on('connection-status', (data) => {
  console.log('连接状态:', data);
});
```

#### 2. 订阅成功通知

**事件名：** `subscribe-success`

**数据格式：**
```typescript
{
  message: string;      // 如 "成功订阅 2 个股票"
  symbols: string[];    // 已订阅的股票列表
}
```

**监听示例：**
```typescript
socket.on('subscribe-success', (data) => {
  console.log('订阅成功:', data.symbols);
});
```

#### 3. 取消订阅成功通知

**事件名：** `unsubscribe-success`

**数据格式：**
```typescript
{
  message: string;
  symbols: string[];
}
```

#### 4. 实时行情数据

**事件名：** `quote-data`

**数据格式：** 来自 alltick.co 的原始行情数据

**监听示例：**
```typescript
socket.on('quote-data', (data) => {
  console.log('收到行情数据:', data);
  // 根据 cmd_id 判断消息类型
  // 根据 data.code 获取股票代码
  // 更新 UI 展示
});
```

**行情数据示例：**
```json
{
  "cmd_id": 22002,
  "seq_id": 123,
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
    ]
  }
}
```

#### 5. 状态信息

**事件名：** `status-info`

**数据格式：**
```typescript
{
  connectionStatus: 'OPEN' | 'CONNECTING' | 'CLOSING' | 'CLOSED';
  subscribedSymbols: string[];  // 当前已订阅的所有股票
  timestamp: string;
}
```

#### 6. 错误信息

**事件名：** `error`

**数据格式：**
```typescript
{
  message: string;  // 错误描述
}
```

---

## 🎯 完整使用流程

### 前端完整示例

```typescript
import { io, Socket } from 'socket.io-client';

class QuoteClient {
  private socket: Socket;
  private subscribedSymbols: Set<string> = new Set();

  constructor() {
    this.socket = io('http://localhost:3000/quote', {
      transports: ['websocket'],
    });
    
    this.setupListeners();
  }

  private setupListeners() {
    // 连接成功
    this.socket.on('connect', () => {
      console.log('✅ 连接成功');
      this.updateConnectionStatus('已连接');
    });

    // 连接断开
    this.socket.on('disconnect', () => {
      console.log('❌ 连接断开');
      this.updateConnectionStatus('未连接');
    });

    // 连接状态
    this.socket.on('connection-status', (data) => {
      console.log('连接状态:', data);
    });

    // 订阅成功
    this.socket.on('subscribe-success', (data) => {
      console.log('订阅成功:', data);
      data.symbols.forEach(s => this.subscribedSymbols.add(s));
      this.updateUI();
    });

    // 取消订阅成功
    this.socket.on('unsubscribe-success', (data) => {
      console.log('取消订阅:', data);
      data.symbols.forEach(s => this.subscribedSymbols.delete(s));
      this.updateUI();
    });

    // 实时行情数据
    this.socket.on('quote-data', (data) => {
      this.handleQuoteData(data);
    });

    // 状态信息
    this.socket.on('status-info', (data) => {
      console.log('状态信息:', data);
    });

    // 错误
    this.socket.on('error', (data) => {
      console.error('错误:', data);
      alert(data.message);
    });
  }

  // 订阅股票
  subscribe(symbols: string[]) {
    if (symbols.length === 0) {
      alert('请输入股票代码');
      return;
    }

    this.socket.emit('subscribe', {
      symbols,
      depthLevel: 5,
    });
  }

  // 取消订阅
  unsubscribe(symbols: string[]) {
    if (symbols.length === 0) {
      alert('请输入要取消订阅的股票代码');
      return;
    }

    this.socket.emit('unsubscribe', { symbols });
  }

  // 获取状态
  getStatus() {
    this.socket.emit('get-status');
  }

  // 处理行情数据
  private handleQuoteData(data: any) {
    console.log('收到行情:', data);
    // 更新 UI，如更新价格、K线图等
  }

  // 更新连接状态 UI
  private updateConnectionStatus(status: string) {
    // 更新页面上的连接状态显示
  }

  // 更新 UI
  private updateUI() {
    // 更新已订阅股票列表展示
  }

  // 断开连接
  disconnect() {
    this.socket.disconnect();
  }
}

// 使用
const quoteClient = new QuoteClient();

// 订阅
quoteClient.subscribe(['700.HK', 'AAPL.US']);

// 取消订阅
quoteClient.unsubscribe(['700.HK']);

// 获取状态
quoteClient.getStatus();
```

---

## 🧪 测试方法

### 方法 1：使用提供的 HTML 测试页面

```bash
# 在浏览器中打开
open test-websocket-client.html
```

页面功能：
- ✅ 实时连接状态显示
- ✅ 订阅/取消订阅操作
- ✅ 实时日志显示
- ✅ 已订阅股票列表

### 方法 2：使用 Node.js 脚本测试

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
  console.log('📊 行情:', data);
});
```

### 方法 3：使用在线工具

访问：https://amritb.github.io/socketio-client-tool/

- **Server URL:** `http://localhost:3000/quote`
- **Event Name:** `subscribe`
- **Message:** `{"symbols":["700.HK"],"depthLevel":5}`

---

## 📋 股票代码格式

| 市场 | 格式 | 示例 |
|-----|------|------|
| 香港股市 | `代码.HK` | `700.HK`（腾讯控股）|
| 美国股市 | `代码.US` | `AAPL.US`（苹果）|
| A股上海 | `代码.SH` | `600000.SH`（浦发银行）|
| A股深圳 | `代码.SZ` | `000001.SZ`（平安银行）|

---

## ⚠️ 注意事项

1. **Token 配置**
   - 默认使用 `testtoken`（测试用）
   - 生产环境需在 `.env.prod` 中配置真实 Token
   - Token 申请：https://alltick.co

2. **API 地址选择**
   - **当前使用**：股票 API (`quote-stock-b-ws-api`)
   - 如需外汇/加密货币，修改 `QuoteService` 中的 URL

3. **连接管理**
   - 自动重连：断开后 5 秒自动重连
   - 心跳保活：每 30 秒发送心跳
   - 订阅恢复：重连后自动恢复订阅

4. **性能考虑**
   - 建议限制订阅数量（如最多 50 个）
   - 高频数据可考虑节流处理
   - 可将行情数据缓存到 Redis

---

## 🔗 相关资源

- **alltick.co GitHub**：https://github.com/alltick/realtime-forex-crypto-stock-tick-finance-websocket-api
- **Token 申请**：https://alltick.co
- **NestJS WebSocket 文档**：https://docs.nestjs.com/websockets/gateways
- **Socket.IO 文档**：https://socket.io/docs/v4/

---

## 🎨 前端 UI 建议

### 搜索框 + 实时行情展示

```
┌─────────────────────────────────────┐
│ 🔍 请输入代码或名称                 │
│ [______________] [订阅] [取消]      │
└─────────────────────────────────────┘

已订阅股票：
┌─────────────────────────────────────┐
│ 700.HK  腾讯控股  HK$ 350.20  ↑    │
│ AAPL.US 苹果     $ 150.25    ↓    │
└─────────────────────────────────────┘
```

### 推荐流程

1. 用户在搜索框输入代码或名称
2. 调用 `/cfd/search` API 搜索产品
3. 展示搜索结果列表
4. 用户点击某个产品
5. 通过 WebSocket 订阅该产品的实时行情
6. 跳转到行情详情页，实时展示价格变动

---

## 💡 实战示例

### 完整的行情订阅流程

```typescript
import { io } from 'socket.io-client';

class QuoteManager {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000/quote');
    this.setupListeners();
  }

  private setupListeners() {
    // 实时行情数据处理
    this.socket.on('quote-data', (data) => {
      if (data.cmd_id === 22002) {
        // 深度行情数据
        this.updateDepthQuote(data.data);
      }
    });
  }

  // 订阅股票
  subscribeStock(code: string) {
    this.socket.emit('subscribe', {
      symbols: [code],
      depthLevel: 5,
    });
  }

  // 更新深度行情
  private updateDepthQuote(data: any) {
    const { code, price, bid, ask, volume } = data;
    
    // 更新价格显示
    document.querySelector(`#price-${code}`).textContent = price;
    
    // 更新买盘/卖盘
    this.updateOrderBook('bid', bid);
    this.updateOrderBook('ask', ask);
  }

  private updateOrderBook(type: 'bid' | 'ask', orders: any[]) {
    // 更新买盘或卖盘的 UI
    orders.forEach((order, index) => {
      console.log(`${type}[${index}]: ${order.price} @ ${order.volume}`);
    });
  }
}
```

---

## 🎊 功能特性

| 特性 | 说明 |
|-----|------|
| ✅ 实时推送 | 行情数据实时推送，延迟低 |
| ✅ 自动重连 | 断线后自动重连，无需手动处理 |
| ✅ 心跳保活 | 自动发送心跳，维持连接 |
| ✅ 订阅管理 | 支持动态订阅/取消订阅 |
| ✅ 状态查询 | 可查询连接状态和订阅列表 |
| ✅ 广播模式 | 所有客户端共享行情数据 |
| ✅ 错误处理 | 完善的错误处理和日志记录 |

---

## 🚀 下一步扩展

1. **数据持久化**
   - 将行情数据存储到 Redis（实时数据）
   - 将历史数据存储到 MySQL（用于回测）

2. **权限控制**
   - 添加客户端认证
   - 限制订阅数量
   - 实现订阅权限管理

3. **性能优化**
   - 数据压缩
   - 限流控制
   - 分组推送（按订阅分组）

4. **功能增强**
   - 支持历史数据查询
   - 支持K线数据推送
   - 支持多种时间周期
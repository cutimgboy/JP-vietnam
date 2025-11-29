# 股票行情数据接入需求文档

## 需求背景
项目需要接入 alltick.co 的股票行情数据源，通过 WebSocket 协议实时获取美股等股票的最新成交价数据，并在项目启动时自动开启推送功能。

## 用户故事
作为交易系统的开发者，我希望能够：
1. 在项目启动时自动连接到 alltick.co 行情数据源
2. 订阅指定美股股票的最新成交价（Tick数据）
3. 实时接收并处理推送的行情数据
4. 确保连接稳定，支持自动重连和心跳机制

## 使用场景
1. **系统启动时**：自动建立 WebSocket 连接到 alltick.co
2. **订阅股票**：支持订阅 AAPL.US、MSFT.US 等美股股票
3. **实时数据接收**：持续接收最新成交价、成交量等数据
4. **数据处理**：对接收到的行情数据进行后续业务处理
5. **连接管理**：处理断线重连、心跳保活等连接管理

## 技术方案

### 1. 数据源连接
- **WebSocket地址**：`wss://quote.alltick.co/quote-stock-b-ws-api`
- **认证方式**：URL参数携带 token
- **连接时机**：项目启动时自动连接

### 2. 协议设计
基于 alltick.co 的标准协议格式：

**请求格式**：
```json
{
    "cmd_id": 22004,
    "seq_id": 123,
    "trace": "unique-trace-id",
    "data": {
        "symbol_list": [
            {"code": "AAPL.US"},
            {"code": "MSFT.US"}
        ]
    }
}
```

**响应格式**：
```json
{
    "ret": 200,
    "msg": "ok",
    "cmd_id": 22005,
    "seq_id": 123,
    "trace": "unique-trace-id",
    "data": {}
}
```

**推送数据格式**：
```json
{
    "cmd_id": 22998,
    "data": {
        "code": "AAPL.US",
        "seq": "1605509068000001",
        "tick_time": "1605509068",
        "price": "150.25",
        "volume": "300",
        "turnover": "12345.6",
        "trade_direction": 1
    }
}
```

### 3. 心跳机制
- **心跳命令**：cmd_id = 22000
- **发送频率**：每10秒一次
- **超时处理**：30秒内无心跳则断开连接

### 4. 目标股票列表
支持的美股股票包括：
- AAPL.US (Apple, Inc.)
- MSFT.US (Microsoft Corp.)
- GOOG.US (Alphabet, Inc.)
- AMZN.US (Amazon.com, Inc.)
- TSLA.US (Tesla, Inc.)
- UNH.US (UnitedHealth Group, Inc.)
- JNJ.US (Johnson & Johnson)
- META.US (Meta Platforms, Inc.)
- V.US (Visa, Inc.)
- XOM.US (Exxon Mobil Corp.)

## 实现细节

### 1. 数据实体设计
创建股票Tick数据实体：
```typescript
interface StockTickData {
  code: string;          // 股票代码
  seq: string;          // 序列号
  tick_time: string;    // 时间戳
  price: string;        // 成交价
  volume: string;       // 成交量
  turnover: string;     // 成交额
  trade_direction: number; // 交易方向
}
```

### 2. 数据流设计
```
alltick.co WebSocket
    ↓ (实时推送)
QuoteService (处理和转换)
    ↓ (标准化数据)
业务服务 (存储、分析、展示)
```

### 3. 逻辑时序设计
1. **启动阶段**：
   - QuoteService 初始化
   - 建立 WebSocket 连接
   - 启动心跳定时器
   - 订阅默认股票列表

2. **运行阶段**：
   - 接收并解析推送数据
   - 转换为内部数据格式
   - 触发数据处理回调
   - 维护连接状态

3. **异常处理**：
   - 连接断开自动重连
   - 重连后恢复订阅
   - 错误日志记录

### 4. 接口设计

**QuoteService 核心接口**：
```typescript
// 连接到行情源
connect(): Promise<void>

// 断开连接
disconnect(): void

// 订阅股票
subscribe(symbols: string[]): void

// 取消订阅
unsubscribe(symbols: string[]): void

// 注册数据回调
onTickData(callback: (data: StockTickData) => void): void

// 获取连接状态
getConnectionStatus(): string
```

## 预期成果

1. **功能完整性**
   - ✅ 自动连接 alltick.co 行情源
   - ✅ 支持美股股票订阅
   - ✅ 实时接收 Tick 数据
   - ✅ 自动重连和心跳机制
   - ✅ 数据格式标准化

2. **性能指标**
   - 连接建立时间 < 3秒
   - 数据推送延迟 < 100ms
   - 重连恢复时间 < 5秒
   - 支持同时订阅 10+ 股票

3. **可靠性**
   - 99%+ 连接可用性
   - 完善的错误处理
   - 详细的日志记录
   - 优雅的降级策略

4. **可扩展性**
   - 易于添加新股票
   - 支持多种数据源
   - 模块化设计
   - 标准化接口

## 风险评估

1. **技术风险**
   - WebSocket 连接稳定性
   - 数据格式兼容性
   - 高频数据处理性能

2. **业务风险**
   - Token 配置错误
   - 订阅数量限制
   - 数据延迟影响

3. **缓解措施**
   - 完善的重连机制
   - 数据验证和容错
   - 性能监控和告警

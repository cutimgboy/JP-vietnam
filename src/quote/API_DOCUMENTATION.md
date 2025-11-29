# 股票实时行情API文档

## 概述

本文档描述了股票实时行情系统的API接口，提供实时的股票买卖价格信息。系统通过WebSocket接收实时行情数据，经过价格变化检测和价差计算后，通过HTTP API提供给前端使用。

## 基础信息

- **Base URL**: `http://localhost:3000/api/quote`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **支持股票**: NVDA.US, MSFT.US, AAPL.US, AMZN.US, GOOG.US

## API接口

### 1. 获取所有股票实时行情

**接口地址**: `GET /api/quote/realtime`

**描述**: 获取所有目标股票的实时买卖价格信息

**请求参数**: 无

**响应示例**:
```json
{
  "codeList": [
    {
      "code": "NVDA.US",
      "buy_price": 145.87,
      "sale_price": 145.47
    },
    {
      "code": "MSFT.US", 
      "buy_price": 378.15,
      "sale_price": 377.85
    },
    {
      "code": "AAPL.US",
      "buy_price": 178.32,
      "sale_price": 178.02
    },
    {
      "code": "AMZN.US",
      "buy_price": 145.63,
      "sale_price": 145.13
    },
    {
      "code": "GOOG.US",
      "buy_price": 139.84,
      "sale_price": 139.54
    }
  ],
  "updated_at": "2024-01-01T10:30:00.123Z"
}
```

**响应字段说明**:
- `codeList`: 股票行情列表
  - `code`: 股票代码
  - `buy_price`: 买入价格（实时价格 + 买入价差）
  - `sale_price`: 卖出价格（实时价格 - 卖出价差）
- `updated_at`: 数据更新时间

### 2. 获取单个股票实时行情

**接口地址**: `GET /api/quote/realtime/{code}`

**描述**: 获取指定股票的实时买卖价格信息

**路径参数**:
- `code`: 股票代码（如: NVDA.US）

**响应示例**:
```json
{
  "code": "NVDA.US",
  "buy_price": 145.87,
  "sale_price": 145.47
}
```

**错误响应**:
```json
{
  "statusCode": 400,
  "message": "股票代码不能为空"
}
```

### 3. 获取WebSocket连接状态

**接口地址**: `GET /api/quote/status/connection`

**描述**: 获取WebSocket连接状态和订阅信息

**响应示例**:
```json
{
  "connectionStatus": "OPEN",
  "subscribedSymbols": ["NVDA.US", "MSFT.US", "AAPL.US", "AMZN.US", "GOOG.US"],
  "timestamp": "2024-01-01T10:30:00.123Z"
}
```

**响应字段说明**:
- `connectionStatus`: 连接状态（CONNECTING, OPEN, CLOSING, CLOSED）
- `subscribedSymbols`: 已订阅的股票列表
- `timestamp`: 响应时间戳

## 数据流程

### WebSocket数据接收
1. 系统连接到外部行情数据源（alltick.co）
2. 订阅指定的5只美股实时行情
3. 每秒接收Tick数据推送

### 价格变化检测
1. 比较新价格与Redis缓存中的价格
2. 只有价格变化超过阈值（0.0001）才触发处理
3. 过滤重复数据，避免无效处理

### 价差计算
1. 从trading_settings表获取价差设置
2. 买入价 = 实时价格 + spread字段
3. 卖出价 = 实时价格 - askSpread字段

### 缓存更新
1. 更新Redis中的股票行情缓存
2. 更新所有股票汇总缓存
3. 异步保存价格变动记录到数据库

## 性能特性

- **响应时间**: < 50ms
- **数据更新频率**: 实时（价格变化时）
- **缓存策略**: Redis多级缓存
- **并发支持**: 支持高并发访问

## 错误处理

### HTTP状态码
- `200`: 成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

### 常见错误信息
- `股票代码不能为空`: 请求参数中缺少股票代码
- `获取实时行情数据失败`: Redis连接或查询失败
- `获取连接状态失败`: WebSocket状态查询失败

## 使用建议

### 前端集成
1. 使用轮询方式调用 `/api/quote/realtime` 接口
2. 建议轮询间隔为1秒
3. 处理网络异常和重连逻辑

### 数据缓存
1. 前端可以缓存响应数据，但建议不超过2秒
2. 使用 `updated_at` 字段判断数据新鲜度
3. 优先使用最新数据，避免显示过期信息

### 错误处理
1. 监控API响应时间
2. 实现重试机制
3. 提供降级方案（显示最后有效数据）

## 监控指标

### 业务指标
- WebSocket连接状态
- 价格更新频率
- API响应时间
- 缓存命中率

### 技术指标
- Redis内存使用
- 数据库连接池状态
- 错误率统计
- 并发请求数

## 版本信息

- **当前版本**: v1.0.0
- **更新日期**: 2024-01-01
- **兼容性**: 向后兼容

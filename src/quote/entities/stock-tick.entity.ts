/**
 * 股票 Tick 数据实体
 * 表示单笔交易的详细信息
 */
export interface StockTickData {
  /** 股票代码，如 AAPL.US */
  code: string;
  
  /** 序列号，用于标识唯一性 */
  seq: string;
  
  /** 时间戳，Unix 时间戳格式 */
  tick_time: string;
  
  /** 成交价格 */
  price: string;
  
  /** 成交量 */
  volume: string;
  
  /** 成交额 */
  turnover: string;
  
  /** 交易方向：1-买入，2-卖出 */
  trade_direction: number;
}

/**
 * WebSocket 推送消息的完整格式
 */
export interface TickPushMessage {
  /** 命令ID，Tick数据推送为 22998 */
  cmd_id: number;
  
  /** 数据内容 */
  data: StockTickData;
}

/**
 * 订阅响应消息格式
 */
export interface SubscribeResponse {
  /** 返回码，200表示成功 */
  ret: number;
  
  /** 返回消息 */
  msg: string;
  
  /** 命令ID */
  cmd_id: number;
  
  /** 序列号 */
  seq_id: number;
  
  /** 跟踪号 */
  trace: string;
  
  /** 数据内容 */
  data: Record<string, any>;
}

/**
 * 心跳响应消息格式
 */
export interface HeartbeatResponse {
  /** 返回码 */
  ret: number;
  
  /** 返回消息 */
  msg: string;
  
  /** 命令ID，心跳响应为 22001 */
  cmd_id: number;
  
  /** 序列号 */
  seq_id: number;
  
  /** 跟踪号 */
  trace: string;
  
  /** 数据内容 */
  data: Record<string, any>;
}

/**
 * 股票代码常量定义
 */
export const US_STOCK_SYMBOLS = {
  /** 苹果公司 */
  APPLE: 'AAPL.US',
  
  /** 微软公司 */
  MICROSOFT: 'MSFT.US',
  
  /** 谷歌（Alphabet） */
  GOOGLE: 'GOOG.US',
  
  /** 亚马逊 */
  AMAZON: 'AMZN.US',
  
  /** 特斯拉 */
  TESLA: 'TSLA.US',
  
  /** 联合健康集团 */
  UNITED_HEALTH: 'UNH.US',
  
  /** 强生公司 */
  JOHNSON_JOHNSON: 'JNJ.US',
  
  /** Meta（Facebook） */
  META: 'META.US',
  
  /** Visa */
  VISA: 'V.US',
  
  /** 埃克森美孚 */
  EXXON_MOBIL: 'XOM.US',
} as const;

/**
 * 默认订阅的美股股票列表
 */
export const DEFAULT_US_STOCKS = [
  US_STOCK_SYMBOLS.APPLE,
  US_STOCK_SYMBOLS.MICROSOFT,
  US_STOCK_SYMBOLS.GOOGLE,
  US_STOCK_SYMBOLS.AMAZON,
  US_STOCK_SYMBOLS.TESLA,
];

/**
 * 交易方向枚举
 */
export enum TradeDirection {
  /** 买入 */
  BUY = 1,
  
  /** 卖出 */
  SELL = 2,
}

/**
 * 消息类型枚举
 */
export enum MessageCommandId {
  /** 心跳请求 */
  HEARTBEAT_REQUEST = 22000,
  
  /** 心跳响应 */
  HEARTBEAT_RESPONSE = 22001,
  
  /** 订阅响应 */
  SUBSCRIBE_RESPONSE = 22005,
  
  /** 最新成交价批量订阅 */
  BATCH_SUBSCRIBE_TICK = 22004,
  
  /** Tick数据推送 */
  TICK_PUSH = 22998,
}

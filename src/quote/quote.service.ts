import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';

/**
 * 行情订阅服务
 * 负责连接外部行情数据源 (alltick.co)
 */
@Injectable()
export class QuoteService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QuoteService.name);
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private readonly reconnectInterval = 5000; // 5秒重连
  private readonly heartbeatInterval = 30000; // 30秒心跳
  
  // 订阅的股票列表
  private subscribedSymbols: Set<string> = new Set();
  
  // 消息回调函数列表
  private messageCallbacks: Array<(data: any) => void> = [];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('QuoteService 初始化...');
    // 模块启动时自动连接
    // await this.connect();
  }

  async onModuleDestroy() {
    this.logger.log('QuoteService 销毁，断开连接...');
    this.disconnect();
  }

  /**
   * 连接到外部行情数据源
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.logger.warn('WebSocket 已经连接');
      return;
    }

    const token = this.configService.get('QUOTE_WS_TOKEN', 'testtoken');
    // 股票 API 地址
    const url = `wss://quote.alltick.co/quote-stock-b-ws-api?token=${token}`;
    
    // 如需订阅外汇、加密货币，使用以下地址：
    // const url = `wss://quote.alltick.co/quote-b-ws-api?token=${token}`;

    this.logger.log(`正在连接到行情服务器: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.on('open', () => this.onOpen());
    this.ws.on('message', (data: WebSocket.Data) => this.onMessage(data));
    this.ws.on('error', (error: Error) => this.onError(error));
    this.ws.on('close', (code: number, reason: Buffer) => this.onClose(code, reason));
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 连接打开回调
   */
  private onOpen(): void {
    this.logger.log('✅ WebSocket 连接成功！');

    // 启动心跳
    this.startHeartbeat();

    // 如果有已订阅的股票，重新订阅
    if (this.subscribedSymbols.size > 0) {
      this.logger.log(`重新订阅 ${this.subscribedSymbols.size} 个股票`);
      this.resubscribe();
    }
  }

  /**
   * 接收消息回调
   */
  private onMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      // 打印日志（可选）
      // this.logger.debug(`收到消息: ${JSON.stringify(message)}`);

      // 通知所有订阅者
      this.messageCallbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          this.logger.error('消息回调执行失败:', error);
        }
      });
    } catch (error) {
      this.logger.error('解析消息失败:', error);
    }
  }

  /**
   * 错误回调
   */
  private onError(error: Error): void {
    this.logger.error('WebSocket 错误:', error.message);
  }

  /**
   * 连接关闭回调
   */
  private onClose(code: number, reason: Buffer): void {
    this.logger.warn(`WebSocket 连接关闭 [${code}]: ${reason.toString()}`);

    // 停止心跳
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // 自动重连
    this.scheduleReconnect();
  }

  /**
   * 定时重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.logger.log(`将在 ${this.reconnectInterval}ms 后重连...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const heartbeat = {
          cmd_id: 22003, // 心跳命令ID
          seq_id: Date.now(),
          trace: `heartbeat-${Date.now()}`,
        };
        this.send(heartbeat);
      }
    }, this.heartbeatInterval);
  }

  /**
   * 发送消息
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.logger.warn('WebSocket 未连接，无法发送消息');
    }
  }

  /**
   * 订阅股票行情
   * @param symbols 股票代码列表，如 ['700.HK', 'AAPL.US']
   * @param depthLevel 深度档位 (1-5)
   */
  subscribe(symbols: string[], depthLevel: number = 5): void {
    if (!symbols || symbols.length === 0) {
      return;
    }

    // 记录订阅
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));

    const subscribeMessage = {
      cmd_id: 22002, // 订阅命令ID
      seq_id: Date.now(),
      trace: `subscribe-${Date.now()}`,
      data: {
        symbol_list: symbols.map(code => ({
          code,
          depth_level: depthLevel,
        })),
      },
    };

    this.logger.log(`订阅股票: ${symbols.join(', ')}`);
    this.send(subscribeMessage);
  }

  /**
   * 取消订阅
   * @param symbols 股票代码列表
   */
  unsubscribe(symbols: string[]): void {
    if (!symbols || symbols.length === 0) {
      return;
    }

    // 移除订阅记录
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));

    const unsubscribeMessage = {
      cmd_id: 22004, // 取消订阅命令ID
      seq_id: Date.now(),
      trace: `unsubscribe-${Date.now()}`,
      data: {
        symbol_list: symbols.map(code => ({ code })),
      },
    };

    this.logger.log(`取消订阅股票: ${symbols.join(', ')}`);
    this.send(unsubscribeMessage);
  }

  /**
   * 重新订阅所有股票
   */
  private resubscribe(): void {
    if (this.subscribedSymbols.size > 0) {
      const symbols = Array.from(this.subscribedSymbols);
      this.subscribe(symbols);
    }
  }

  /**
   * 注册消息回调
   * @param callback 回调函数
   */
  onMessage(callback: (data: any) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * 移除消息回调
   * @param callback 回调函数
   */
  offMessage(callback: (data: any) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): string {
    if (!this.ws) {
      return 'CLOSED';
    }
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * 获取已订阅股票列表
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }
}
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import WebSocket from 'ws';
import { RedisService } from '../redis/redis.service';
import { 
  StockTickData, 
  TickPushMessage, 
  SubscribeResponse, 
  HeartbeatResponse,
  MessageCommandId,
  DEFAULT_US_STOCKS
} from './entities/stock-tick.entity';
import { StockRealtimePriceEntity } from './entities/stock-realtime-price.entity';
import { StockPriceChangeEntity } from './entities/stock-price-change.entity';
import { TradingSettingsEntity } from '../cfd/entities/trading-settings.entity';

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
  private readonly heartbeatInterval = 10000; // 10秒心跳（按照API要求）
  
  // 订阅的股票列表 - 限制为指定的5只股票
  private readonly targetSymbols = ['NVDA.US', 'MSFT.US', 'AAPL.US', 'AMZN.US', 'GOOG.US'];
  private subscribedSymbols: Set<string> = new Set();
  
  // 序列号计数器
  private sequenceId: number = 1;
  
  // 用于去重的最近收到的Tick数据缓存
  private recentTickCache: Map<string, { tick: StockTickData, timestamp: number }> = new Map();
  private readonly cacheExpiryTime = 1000; // 1秒内的重复数据将被过滤

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    @InjectRepository(StockRealtimePriceEntity)
    private stockRealtimePriceRepository: Repository<StockRealtimePriceEntity>,
    @InjectRepository(StockPriceChangeEntity)
    private stockPriceChangeRepository: Repository<StockPriceChangeEntity>,
    @InjectRepository(TradingSettingsEntity)
    private tradingSettingsRepository: Repository<TradingSettingsEntity>,
  ) {}

  async onModuleInit() {
    this.logger.log('QuoteService 初始化...');
    // 模块启动时自动连接
    await this.connect();
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
    this.logger.log(`使用 Token: ${token}`);
    // 股票 API 地址 - 使用正确的 alltick.co 股票 WebSocket API
    const url = `wss://quote.alltick.co/quote-stock-b-ws-api?token=${token}`;
    
    this.logger.log(`正在连接到行情服务器: ${url}`);

    this.ws = new WebSocket(url);

    if (this.ws) {
      this.ws.on('open', () => this.onOpen());
      this.ws.on('message', (data: WebSocket.Data) => this.onMessage(data));
      this.ws.on('error', (error: Error) => this.onError(error));
      this.ws.on('close', (code: number, reason: Buffer) => this.onClose(code, reason));
    }
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

    // 启动心跳机制
    this.startHeartbeat();
    this.logger.log('心跳机制已启动');
    
    // 订阅指定的5只股票
    this.subscribe(this.targetSymbols);
    this.logger.log(`已订阅目标股票: ${this.targetSymbols.join(', ')}`);
  }

  /**
   * 接收消息回调
   */
  private onMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      // 根据命令ID处理不同类型的消息
      switch (message.cmd_id) {
        case MessageCommandId.TICK_PUSH:
          this.handleTickData(message as TickPushMessage);
          break;
        case MessageCommandId.SUBSCRIBE_RESPONSE:
          this.handleSubscribeResponse(message as SubscribeResponse);
          break;
        case MessageCommandId.HEARTBEAT_RESPONSE:
          this.handleHeartbeatResponse(message as HeartbeatResponse);
          break;
        default:
          this.logger.debug(`收到未处理的消息类型: ${message.cmd_id}`);
          this.logger.debug(`完整消息内容:`, message);
      }
    } catch (error) {
      this.logger.error('解析消息失败:', error);
    }
  }

  /**
   * 处理 Tick 数据推送
   */
  private handleTickData(message: TickPushMessage): void {
    const tickData = message.data;
    
    // 创建唯一键：股票代码 + 价格 + 时间戳
    const uniqueKey = `${tickData.code}-${tickData.price}-${tickData.tick_time}`;
    const now = Date.now();
    
    // 检查是否为重复数据
    const cached = this.recentTickCache.get(uniqueKey);
    if (cached && (now - cached.timestamp) < this.cacheExpiryTime) {
      // 重复数据，跳过处理
      return;
    }
    
    // 缓存新的Tick数据
    this.recentTickCache.set(uniqueKey, { tick: tickData, timestamp: now });
    
    // 清理内存中的过期缓存数据
    this.cleanMemoryCache();
    
    this.logger.debug(`收到新的 Tick 数据: ${tickData.code} - ${tickData.price}`);
    
    // 处理价格变化和缓存更新
    this.processPriceChange(tickData);
  }

  /**
   * 清理内存中的过期缓存数据
   */
  private cleanMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.recentTickCache.entries()) {
      if (now - value.timestamp > this.cacheExpiryTime) {
        this.recentTickCache.delete(key);
      }
    }
  }

  /**
   * 处理订阅响应
   */
  private handleSubscribeResponse(message: SubscribeResponse): void {
    if (message.ret === 200) {
      this.logger.log(`订阅成功: ${message.msg}`);
      this.logger.debug(`订阅响应 - 序列号: ${message.seq_id}, 跟踪号: ${message.trace}`);
    } else {
      this.logger.error(`订阅失败: ${message.msg}`);
      this.logger.error(`订阅响应详情 - 返回码: ${message.ret}, 序列号: ${message.seq_id}, 跟踪号: ${message.trace}`);
    }
  }

  /**
   * 处理心跳响应
   */
  private handleHeartbeatResponse(message: HeartbeatResponse): void {
    this.logger.log('收到心跳响应:', JSON.stringify(message, null, 2));
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
        // 生成 UUID-时间戳格式的trace
        const uuid = '3baaa938-f92c-4a74-a228-fd49d5e2f8bc';
        const timestamp = Date.now();
        const heartbeat = {
          cmd_id: 22000,
          seq_id: 6666,
          trace: `${uuid}-${timestamp}`,
          data: {},
        };
        this.logger.log('发送心跳:', JSON.stringify(heartbeat, null, 2));
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
   * 订阅股票行情 - 使用最新成交价批量订阅接口
   * @param symbols 股票代码列表，如 ['700.HK', 'AAPL.US']
   */
  subscribe(symbols: string[]): void {
    if (!symbols || symbols.length === 0) {
      return;
    }

    // 记录订阅
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));

    const subscribeMessage = {
      cmd_id: 22004, // 最新成交价批量订阅命令ID
      seq_id: this.sequenceId++,
      trace: `subscribe-${Date.now()}`,
      data: {
        symbol_list: symbols.map(code => ({
          code,
        })),
      },
    };

    this.logger.log(`订阅股票: ${symbols.join(', ')}`);
    this.logger.debug('订阅消息内容:', JSON.stringify(subscribeMessage, null, 2));
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
      cmd_id: 22004, // 最新成交价批量订阅命令ID（覆盖式订阅）
      seq_id: this.sequenceId++,
      trace: `unsubscribe-${Date.now()}`,
      data: {
        symbol_list: [], // 发送空列表表示取消所有订阅
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

  /**
   * 处理价格变化和缓存更新
   */
  private async processPriceChange(tickData: StockTickData): Promise<void> {
    try {
      const code = tickData.code;
      const newPrice = parseFloat(tickData.price);
      
      // 获取Redis中的缓存价格
      const cachedPrice = await this.redisService.getStockPrice(code);

      // 检查价格是否真的变化了
      if (cachedPrice !== null && Math.abs(cachedPrice - newPrice) < 0.0001) {
        // 价格没有变化，跳过处理
        return;
      }

      this.logger.log(`价格变化检测: ${code} ${cachedPrice} -> ${newPrice}`);

      // 获取价差设置
      const tradingSettings = await this.getTradingSettings(code);
      
      // 计算买卖价格
      const bidSpread = parseFloat(tradingSettings?.bidSpread?.toString() || '0');
      const askSpread = parseFloat(tradingSettings?.askSpread?.toString() || '0');
      const buyPrice = newPrice + bidSpread;
      const salePrice = newPrice - askSpread;

      this.logger.log(`价格计算 ${code}: 实时价格=${newPrice}, bidSpread=${bidSpread}, askSpread=${askSpread}, 买价=${buyPrice}, 卖价=${salePrice}`);

      // 更新Redis缓存
      const quoteData = {
        code,
        realtime_price: newPrice,
        buy_price: buyPrice,
        sale_price: salePrice,
        bidSpread: bidSpread,
        askSpread: askSpread,
        volume: parseInt(tickData.volume),
        tick_time: tickData.tick_time,
        updated_at: new Date().toISOString(),
      };

      // 使用新的Redis缓存方法
      await this.redisService.setStockQuote(code, quoteData);
      await this.redisService.setStockPrice(code, newPrice);
      await this.redisService.setStockSpread(code, {
        bidSpread: tradingSettings?.bidSpread || 0,
        askSpread: tradingSettings?.askSpread || 0,
      });

      // 异步保存到数据库（不等待完成）
      this.saveToDatabase(tickData, cachedPrice);

      // 更新所有股票汇总缓存
      await this.updateAllQuotesCache();

    } catch (error) {
      this.logger.error('处理价格变化失败:', error);
    }
  }

  /**
   * 获取交易设置
   */
  private async getTradingSettings(code: string): Promise<TradingSettingsEntity | null> {
    try {
      return await this.tradingSettingsRepository.findOne({
        where: { code },
      });
    } catch (error) {
      this.logger.error(`获取 ${code} 交易设置失败:`, error);
      return null;
    }
  }


  /**
   * 保存到数据库
   */
  private async saveToDatabase(tickData: StockTickData, oldPrice: number | null): Promise<void> {
    try {
      const newPrice = parseFloat(tickData.price);
      
      // 解析时间戳，如果无效则使用当前时间
      let tickTime: Date;
      try {
        tickTime = new Date(tickData.tick_time);
        if (isNaN(tickTime.getTime())) {
          tickTime = new Date();
        }
      } catch (error) {
        this.logger.warn(`无效的时间戳 ${tickData.tick_time}，使用当前时间`);
        tickTime = new Date();
      }

      // 保存实时价格
      const realtimePrice = new StockRealtimePriceEntity();
      realtimePrice.code = tickData.code;
      realtimePrice.price = newPrice;
      realtimePrice.volume = parseInt(tickData.volume);
      realtimePrice.turnover = parseFloat(tickData.turnover);
      realtimePrice.tick_time = tickTime;
      
      await this.stockRealtimePriceRepository.save(realtimePrice);

      // 如果价格有变化，记录价格变动
      if (oldPrice !== null && Math.abs(oldPrice - newPrice) >= 0.0001) {
        const priceChange = new StockPriceChangeEntity();
        priceChange.code = tickData.code;
        priceChange.old_price = oldPrice;
        priceChange.new_price = newPrice;
        priceChange.price_change = newPrice - oldPrice;
        priceChange.change_rate = oldPrice !== 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
        priceChange.volume = parseInt(tickData.volume);
        priceChange.tick_time = tickTime;
        
        await this.stockPriceChangeRepository.save(priceChange);
      }

      this.logger.debug(`已保存 ${tickData.code} 数据到数据库`);
    } catch (error) {
      this.logger.error(`保存 ${tickData.code} 数据到数据库失败:`, error);
    }
  }

  /**
   * 更新所有股票汇总缓存
   */
  private async updateAllQuotesCache(): Promise<void> {
    try {
      // 使用新的批量获取方法
      const quotes = await this.redisService.getBatchStockQuotes(this.targetSymbols);

      const allQuotesData = {
        codeList: quotes,
        updated_at: new Date().toISOString(),
      };

      await this.redisService.setAllQuotes(allQuotesData);
      this.logger.debug('已更新所有股票汇总缓存');
    } catch (error) {
      this.logger.error('更新所有股票汇总缓存失败:', error);
    }
  }

  /**
   * 获取所有股票实时行情（供Controller调用）
   */
  async getAllRealtimeQuotes(): Promise<any> {
    try {
      const cachedData = await this.redisService.getAllQuotes();
      
      if (cachedData) {
        return cachedData;
      }
      
      // 如果缓存不存在，返回空数据
      return {
        codeList: [],
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('获取所有股票实时行情失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个股票实时行情（供Controller调用）
   */
  async getRealtimeQuote(code: string): Promise<any> {
    try {
      const cachedData = await this.redisService.getStockQuote(code);
      
      if (cachedData) {
        return {
          code: cachedData.code,
          buy_price: cachedData.buy_price,
          sale_price: cachedData.sale_price,
        };
      }
      
      // 如果缓存不存在，返回空数据
      return {
        code,
        buy_price: 0,
        sale_price: 0,
      };
    } catch (error) {
      this.logger.error(`获取 ${code} 实时行情失败:`, error);
      throw error;
    }
  }

  /**
   * 获取缓存统计信息（用于监控）
   */
  async getCacheStats(): Promise<any> {
    try {
      return await this.redisService.getCacheStats('stock:*');
    } catch (error) {
      this.logger.error('获取缓存统计信息失败:', error);
      return null;
    }
  }

  /**
   * 清理过期缓存（用于维护）
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      return await this.redisService.cleanExpiredCache('stock:*');
    } catch (error) {
      this.logger.error('清理过期缓存失败:', error);
      return 0;
    }
  }

  /**
   * 测试价格计算逻辑（用于调试）
   */
  async testPriceCalculation(code: string, price: number): Promise<any> {
    try {
      const tradingSettings = await this.getTradingSettings(code);
      const bidSpread = parseFloat(tradingSettings?.bidSpread?.toString() || '0');
      const askSpread = parseFloat(tradingSettings?.askSpread?.toString() || '0');
      const buyPrice = price + bidSpread;
      const salePrice = price - askSpread;
      const spread = buyPrice - salePrice;

      this.logger.log(`测试价格计算 ${code}: 实时价格=${price}, bidSpread=${bidSpread}, askSpread=${askSpread}`);
      this.logger.log(`计算结果: 买价=${buyPrice}, 卖价=${salePrice}, 价差=${spread}`);

      return {
        code,
        realtime_price: price,
        bidSpread,
        askSpread,
        buy_price: buyPrice,
        sale_price: salePrice,
        spread: spread
      };
    } catch (error) {
      this.logger.error(`测试价格计算失败:`, error);
      throw error;
    }
  }
}
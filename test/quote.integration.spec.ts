import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteModule } from '../src/quote/quote.module';
import { RedisModule } from '../src/redis/redis.module';
import { QuoteService } from '../src/quote/quote.service';
import { QuoteController } from '../src/quote/quote.controller';
import { StockRealtimePriceEntity } from '../src/quote/entities/stock-realtime-price.entity';
import { StockPriceChangeEntity } from '../src/quote/entities/stock-price-change.entity';
import { TradingSettingsEntity } from '../src/cfd/entities/trading-settings.entity';

describe('Quote Integration Tests', () => {
  let module: TestingModule;
  let quoteService: QuoteService;
  let quoteController: QuoteController;

  beforeAll(async () => {
    const testConfig = {
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 3306,
      DATABASE_USERNAME: 'test',
      DATABASE_PASSWORD: 'test',
      DATABASE_NAME: 'test_db',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      QUOTE_WS_TOKEN: 'test_token',
    };

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => testConfig],
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: testConfig.DATABASE_HOST,
          port: testConfig.DATABASE_PORT,
          username: testConfig.DATABASE_USERNAME,
          password: testConfig.DATABASE_PASSWORD,
          database: testConfig.DATABASE_NAME,
          entities: [StockRealtimePriceEntity, StockPriceChangeEntity, TradingSettingsEntity],
          synchronize: true, // 测试环境允许自动创建表
          logging: false,
        }),
        TypeOrmModule.forFeature([
          StockRealtimePriceEntity,
          StockPriceChangeEntity,
          TradingSettingsEntity,
        ]),
        RedisModule,
        QuoteModule,
      ],
    }).compile();

    quoteService = module.get<QuoteService>(QuoteService);
    quoteController = module.get<QuoteController>(QuoteController);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    // 这里可以添加清理逻辑，确保每个测试都是独立的
  });

  describe('端到端数据流测试', () => {
    it('应该能够处理完整的股票价格更新流程', async () => {
      // 这个测试需要模拟WebSocket数据接收
      // 由于WebSocket连接的复杂性，这里主要测试业务逻辑
      
      // 测试获取所有股票行情
      const allQuotes = await quoteService.getAllRealtimeQuotes();
      expect(allQuotes).toHaveProperty('codeList');
      expect(Array.isArray(allQuotes.codeList)).toBe(true);
    });

    it('应该能够获取单个股票的实时行情', async () => {
      const singleQuote = await quoteService.getRealtimeQuote('NVDA.US');
      expect(singleQuote).toHaveProperty('code');
      expect(singleQuote).toHaveProperty('buy_price');
      expect(singleQuote).toHaveProperty('sale_price');
    });
  });

  describe('Controller集成测试', () => {
    it('应该能够通过Controller获取所有股票行情', async () => {
      const result = await quoteController.getAllRealtimeQuotes();
      expect(result).toHaveProperty('codeList');
      expect(Array.isArray(result.codeList)).toBe(true);
    });

    it('应该能够通过Controller获取单个股票行情', async () => {
      const result = await quoteController.getRealtimeQuote('NVDA.US');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('buy_price');
      expect(result).toHaveProperty('sale_price');
    });

    it('应该能够获取连接状态', async () => {
      const result = await quoteController.getConnectionStatus();
      expect(result).toHaveProperty('connectionStatus');
      expect(result).toHaveProperty('subscribedSymbols');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('性能测试', () => {
    it('API响应时间应该小于50ms', async () => {
      const startTime = Date.now();
      await quoteController.getAllRealtimeQuotes();
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(50);
    });

    it('单个股票查询响应时间应该小于30ms', async () => {
      const startTime = Date.now();
      await quoteController.getRealtimeQuote('NVDA.US');
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(30);
    });
  });
});
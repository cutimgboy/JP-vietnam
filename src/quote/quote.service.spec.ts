import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteService } from './quote.service';
import { RedisService } from '../redis/redis.service';
import { StockRealtimePriceEntity } from './entities/stock-realtime-price.entity';
import { StockPriceChangeEntity } from './entities/stock-price-change.entity';
import { TradingSettingsEntity } from '../cfd/entities/trading-settings.entity';
import { StockTickData } from './entities/stock-tick.entity';

describe('QuoteService', () => {
  let service: QuoteService;
  let redisService: RedisService;
  let tradingSettingsRepository: Repository<TradingSettingsEntity>;
  let stockRealtimePriceRepository: Repository<StockRealtimePriceEntity>;
  let stockPriceChangeRepository: Repository<StockPriceChangeEntity>;

  const mockRedisService = {
    get: jest.fn(),
    setex: jest.fn(),
    getClient: jest.fn(() => ({
      get: jest.fn(),
      setex: jest.fn(),
    })),
  };

  const mockTradingSettingsRepository = {
    findOne: jest.fn(),
  };

  const mockStockRealtimePriceRepository = {
    save: jest.fn(),
  };

  const mockStockPriceChangeRepository = {
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: getRepositoryToken(TradingSettingsEntity),
          useValue: mockTradingSettingsRepository,
        },
        {
          provide: getRepositoryToken(StockRealtimePriceEntity),
          useValue: mockStockRealtimePriceRepository,
        },
        {
          provide: getRepositoryToken(StockPriceChangeEntity),
          useValue: mockStockPriceChangeRepository,
        },
      ],
    }).compile();

    service = module.get<QuoteService>(QuoteService);
    redisService = module.get<RedisService>(RedisService);
    tradingSettingsRepository = module.get<Repository<TradingSettingsEntity>>(
      getRepositoryToken(TradingSettingsEntity),
    );
    stockRealtimePriceRepository = module.get<Repository<StockRealtimePriceEntity>>(
      getRepositoryToken(StockRealtimePriceEntity),
    );
    stockPriceChangeRepository = module.get<Repository<StockPriceChangeEntity>>(
      getRepositoryToken(StockPriceChangeEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('价格计算逻辑测试', () => {
    it('应该正确计算买入价格和卖出价格', async () => {
      const mockTradingSettings: TradingSettingsEntity = {
        id: 1,
        code: 'NVDA.US',
        spread: 0.20,
        askSpread: 0.20,
      } as TradingSettingsEntity;

      const mockTickData: StockTickData = {
        code: 'NVDA.US',
        price: '145.67',
        volume: '1000000',
        turnover: '145670000',
        tick_time: '2024-01-01T10:30:00.123Z',
        seq: '12345',
        trade_direction: 1,
      };

      // 模拟Redis缓存中没有旧价格
      mockRedisService.get.mockResolvedValue(null);
      
      // 模拟trading_settings查询
      mockTradingSettingsRepository.findOne.mockResolvedValue(mockTradingSettings);

      // 模拟Redis操作
      const mockRedisClient = {
        setex: jest.fn(),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);

      // 调用私有方法进行测试
      await (service as any).processPriceChange(mockTickData);

      // 验证Redis缓存更新
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'stock:quote:NVDA.US',
        60,
        expect.stringContaining('"buy_price":145.87')
      );
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'stock:quote:NVDA.US',
        60,
        expect.stringContaining('"sale_price":145.47')
      );

      // 验证价格计算
      const expectedBuyPrice = 145.67 + 0.20; // 145.87
      const expectedSalePrice = 145.67 - 0.20; // 145.47

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'stock:quote:NVDA.US',
        60,
        expect.stringContaining(`"buy_price":${expectedBuyPrice}`)
      );
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'stock:quote:NVDA.US',
        60,
        expect.stringContaining(`"sale_price":${expectedSalePrice}`)
      );
    });

    it('应该在价格没有变化时跳过处理', async () => {
      const mockTickData: StockTickData = {
        code: 'NVDA.US',
        price: '145.67',
        volume: '1000000',
        turnover: '145670000',
        tick_time: '2024-01-01T10:30:00.123Z',
        seq: '12345',
        trade_direction: 1,
      };

      // 模拟Redis缓存中有相同价格
      mockRedisService.get.mockResolvedValue('145.67');

      // 模拟Redis操作
      const mockRedisClient = {
        setex: jest.fn(),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);

      // 调用私有方法进行测试
      await (service as any).processPriceChange(mockTickData);

      // 验证没有调用Redis更新（因为价格没有变化）
      expect(mockRedisClient.setex).not.toHaveBeenCalled();
    });

    it('应该在没有价差设置时使用默认值', async () => {
      const mockTickData: StockTickData = {
        code: 'NVDA.US',
        price: '145.67',
        volume: '1000000',
        turnover: '145670000',
        tick_time: '2024-01-01T10:30:00.123Z',
        seq: '12345',
        trade_direction: 1,
      };

      // 模拟Redis缓存中没有旧价格
      mockRedisService.get.mockResolvedValue(null);
      
      // 模拟trading_settings查询返回null
      mockTradingSettingsRepository.findOne.mockResolvedValue(null);

      // 模拟Redis操作
      const mockRedisClient = {
        setex: jest.fn(),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);

      // 调用私有方法进行测试
      await (service as any).processPriceChange(mockTickData);

      // 验证Redis缓存更新（使用默认价差0）
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'stock:quote:NVDA.US',
        60,
        expect.stringContaining('"buy_price":145.67')
      );
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'stock:quote:NVDA.US',
        60,
        expect.stringContaining('"sale_price":145.67')
      );
    });
  });

  describe('获取实时行情测试', () => {
    it('应该返回所有股票的实时行情', async () => {
      const mockRedisData = {
        codeList: [
          { code: 'NVDA.US', buy_price: 145.87, sale_price: 145.47 },
          { code: 'MSFT.US', buy_price: 378.15, sale_price: 377.85 },
        ],
        updated_at: '2024-01-01T10:30:00.123Z',
      };

      const mockRedisClient = {
        get: jest.fn().mockResolvedValue(JSON.stringify(mockRedisData)),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);

      const result = await service.getAllRealtimeQuotes();

      expect(result).toEqual(mockRedisData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('stock:quotes:all');
    });

    it('应该返回单个股票的实时行情', async () => {
      const mockQuoteData = {
        code: 'NVDA.US',
        realtime_price: 145.67,
        buy_price: 145.87,
        sale_price: 145.47,
        spread: 0.20,
        askSpread: 0.20,
        volume: 1000000,
        tick_time: '2024-01-01T10:30:00.123Z',
        updated_at: '2024-01-01T10:30:00.123Z',
      };

      const mockRedisClient = {
        get: jest.fn().mockResolvedValue(JSON.stringify(mockQuoteData)),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);

      const result = await service.getRealtimeQuote('NVDA.US');

      expect(result).toEqual({
        code: 'NVDA.US',
        buy_price: 145.87,
        sale_price: 145.47,
      });
      expect(mockRedisClient.get).toHaveBeenCalledWith('stock:quote:NVDA.US');
    });

    it('应该在缓存不存在时返回默认值', async () => {
      const mockRedisClient = {
        get: jest.fn().mockResolvedValue(null),
      };
      mockRedisService.getClient.mockReturnValue(mockRedisClient);

      const result = await service.getRealtimeQuote('NVDA.US');

      expect(result).toEqual({
        code: 'NVDA.US',
        buy_price: 0,
        sale_price: 0,
      });
    });
  });
});
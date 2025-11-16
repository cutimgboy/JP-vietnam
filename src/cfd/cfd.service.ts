import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradingSettingsEntity } from './entities/trading-settings.entity';
import { StockInfoEntity } from './entities/stock-info.entity';
import { CryptoInfoEntity } from './entities/crypto-info.entity';

@Injectable()
export class CfdService {
  constructor(
    @InjectRepository(TradingSettingsEntity)
    private tradingSettingsRepository: Repository<TradingSettingsEntity>,
    
    @InjectRepository(StockInfoEntity)
    private stockInfoRepository: Repository<StockInfoEntity>,
    
    @InjectRepository(CryptoInfoEntity)
    private cryptoInfoRepository: Repository<CryptoInfoEntity>,
  ) {}

  /**
   * 导入品种交易设置数据
   */
  async importTradingSettings(data: any[]): Promise<number> {
    const entities = data.map(item => {
      const entity = new TradingSettingsEntity();
      entity.orderNum = item['序号'];
      entity.type = item['品种类型'];
      entity.code = item['代码'];
      entity.nameCn = item['简体名称'];
      entity.nameEn = item['英文名称'];
      entity.nameVn = item['越南语名称'];
      entity.currencyType = item['货币类型'];
      entity.marginCurrency = item['保证金货币'];
      entity.decimalPlaces = item['小数位'];
      entity.bidSpread = item['买价价差'];
      entity.askSpread = item['卖价价差'];
      entity.spread = item['价差'];
      entity.contractSize = item['合约量'];
      entity.minPriceChange = item['交易最小变动'];
      entity.fixedLeverage = item['固定杠杆'];
      entity.liquidationRange = item['涨跌爆仓幅度'];
      entity.forcedLiquidationRatio = item['强制平仓比例'];
      entity.tradingHours = item['交易时间'];
      return entity;
    });

    await this.tradingSettingsRepository.save(entities);
    return entities.length;
  }

  /**
   * 导入股票基础信息数据
   */
  async importStockInfo(data: any[]): Promise<number> {
    const entities = data.map(item => {
      const entity = new StockInfoEntity();
      entity.orderNum = item['序号'];
      entity.type = item['品种类型'];
      entity.code = item['代码'];
      entity.nameCn = item['简体名称'];
      entity.nameEn = item['英文名称'];
      entity.companyName = item['公司名称'];
      entity.listingDate = this.excelDateToJSDate(item['上市日期']) || undefined;
      entity.issuePrice = item['发行价格'];
      entity.isinCode = item['ISIN代码'];
      entity.foundedYear = item['成立日期'];
      entity.ceo = item['CEO'];
      entity.marketCn = item['所属市场(简)'];
      entity.marketEn = item['所属市场(英/越)'];
      entity.employees = item['员工数量'];
      entity.fiscalYearEnd = this.excelDateToJSDate(item['年结日']) || undefined;
      entity.address = item['公司地址'];
      entity.city = item['城市(简/英/越)'];
      entity.provinceCn = item['省份（简）'];
      entity.provinceEn = item['省份(英/越)'];
      entity.countryCn = item['国家(简)'];
      entity.countryEn = item['国家(英)'];
      entity.countryVn = item['国家(越)'];
      entity.zipCode = item['邮编'];
      entity.phone = item['电话'];
      entity.website = item['网址'];
      entity.descriptionCn = item['公司简介（简体）'];
      entity.descriptionVn = item['公司简介（越南）'];
      return entity;
    });

    await this.stockInfoRepository.save(entities);
    return entities.length;
  }

  /**
   * 导入加密货币基础信息数据
   */
  async importCryptoInfo(data: any[]): Promise<number> {
    const entities = data.map(item => {
      const entity = new CryptoInfoEntity();
      entity.orderNum = item['序号'];
      entity.type = item['品种类型'];
      entity.code = item['代码'];
      entity.nameCn = item['简体名称'];
      entity.nameEn = item['英文名称'];
      entity.marketCapRank = item['市值排名'];
      entity.marketCap = item['市值'];
      entity.fullyDilutedMarketCap = item['完全稀释市值'];
      entity.circulatingSupply = item['流通数量'];
      entity.maxSupply = item['最大供给量'];
      entity.totalSupply = item['总量'];
      entity.launchDate = this.excelDateToJSDate(item['发行日期']) || undefined;
      entity.allTimeHigh = item['历史最高价'];
      entity.allTimeLow = item['历史最低价'];
      entity.descriptionCn = item['币种简介（简体）'];
      entity.descriptionVn = item['币种简介（越南）'];
      return entity;
    });

    await this.cryptoInfoRepository.save(entities);
    return entities.length;
  }

  /**
   * 查询所有品种交易设置
   */
  async findAllTradingSettings(): Promise<TradingSettingsEntity[]> {
    return await this.tradingSettingsRepository.find();
  }

  /**
   * 根据代码查询品种交易设置
   */
  async findTradingSettingsByCode(code: string): Promise<TradingSettingsEntity | null> {
    return await this.tradingSettingsRepository.findOne({ where: { code } });
  }

  /**
   * 查询所有股票信息
   */
  async findAllStocks(): Promise<StockInfoEntity[]> {
    return await this.stockInfoRepository.find();
  }

  /**
   * 根据代码查询股票信息
   */
  async findStockByCode(code: string): Promise<StockInfoEntity | null> {
    return await this.stockInfoRepository.findOne({ where: { code } });
  }

  /**
   * 查询所有加密货币信息
   */
  async findAllCryptos(): Promise<CryptoInfoEntity[]> {
    return await this.cryptoInfoRepository.find();
  }

  /**
   * 根据代码查询加密货币信息
   */
  async findCryptoByCode(code: string): Promise<CryptoInfoEntity | null> {
    return await this.cryptoInfoRepository.findOne({ where: { code } });
  }

  /**
   * 搜索产品（按优先级：代码完全匹配 → 名称关键词匹配 → 模糊匹配）
   * 只搜索 trading_settings 表
   */
  async searchProducts(keyword: string): Promise<any[]> {
    const upperKeyword = keyword.toUpperCase();
    const results: any[] = [];

    // 1. 代码完全匹配（最高优先级）
    const exactMatch = await this.tradingSettingsRepository
      .createQueryBuilder('ts')
      .where('UPPER(ts.code) = :code', { code: upperKeyword })
      .getMany();

    if (exactMatch.length > 0) {
      results.push(
        ...exactMatch.map(item => ({
          ...item,
          matchType: 'exact', // 完全匹配
          source: 'trading_settings',
        }))
      );
    }

    // 2. 名称关键词匹配（中等优先级）
    // 搜索简体名称、英文名称、越南名称
    const nameMatch = await this.tradingSettingsRepository
      .createQueryBuilder('ts')
      .where('UPPER(ts.code) != :code', { code: upperKeyword })
      .andWhere(
        '(ts.nameCn LIKE :keyword OR ts.nameEn LIKE :keyword OR ts.nameVn LIKE :keyword)',
        { keyword: `%${keyword}%` }
      )
      .getMany();

    if (nameMatch.length > 0) {
      results.push(
        ...nameMatch.map(item => ({
          ...item,
          matchType: 'keyword', // 关键词匹配
          source: 'trading_settings',
        }))
      );
    }

    // 3. 模糊匹配（最低优先级）
    // 如果前两种都没找到，进行更宽松的模糊搜索
    if (results.length === 0) {
      const fuzzyMatch = await this.tradingSettingsRepository
        .createQueryBuilder('ts')
        .where(
          '(UPPER(ts.code) LIKE :fuzzy OR ts.nameCn LIKE :fuzzy OR ts.nameEn LIKE :fuzzy)',
          { fuzzy: `%${keyword}%` }
        )
        .getMany();

      if (fuzzyMatch.length > 0) {
        results.push(
          ...fuzzyMatch.map(item => ({
            ...item,
            matchType: 'fuzzy', // 模糊匹配
            source: 'trading_settings',
          }))
        );
      }
    }

    return results;
  }

  /**
   * 转换 Excel 日期为 JS Date
   * Excel 日期是从 1900-01-01 开始的天数
   */
  private excelDateToJSDate(excelDate: number): Date | null {
    if (!excelDate || typeof excelDate !== 'number') {
      return null;
    }
    // Excel 日期从 1900-01-01 开始，但错误地认为 1900 是闰年
    // 需要减去 25569 转换为 Unix 时间戳起点（1970-01-01）
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date;
  }
}
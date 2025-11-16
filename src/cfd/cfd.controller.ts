import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CfdService } from './cfd.service';
import { Public } from '../user/decorators/public.decorator';

@ApiTags('CFD品种信息')
@Controller('cfd')
export class CfdController {
  constructor(private readonly cfdService: CfdService) {}

  @Get('search')
  @ApiOperation({ summary: '搜索产品（支持代码或名称）' })
  @ApiQuery({ 
    name: 'keyword', 
    description: '搜索关键词（代码或名称）', 
    example: 'AAPL',
    required: true 
  })
  async searchProducts(@Query('keyword') keyword: string) {
    if (!keyword || keyword.trim() === '') {
      return {
        success: false,
        message: '请输入代码或名称',
        data: [],
      };
    }

    const results = await this.cfdService.searchProducts(keyword.trim());
    
    if (results.length === 0) {
      return {
        success: false,
        message: '未找到相关产品',
        data: [],
      };
    }

    return {
      success: true,
      message: `找到 ${results.length} 个相关产品`,
      data: results,
    };
  }

  @Get('trading-settings')
  @ApiOperation({ summary: '获取所有品种交易设置' })
  async getAllTradingSettings() {
    return await this.cfdService.findAllTradingSettings();
  }

  @Get('trading-settings/:code')
  @ApiOperation({ summary: '根据代码获取品种交易设置' })
  @ApiParam({ name: 'code', description: '品种代码', example: 'US500' })
  async getTradingSettingsByCode(@Param('code') code: string) {
    return await this.cfdService.findTradingSettingsByCode(code);
  }

  @Get('stocks')
  @ApiOperation({ summary: '获取所有股票信息' })
  async getAllStocks() {
    return await this.cfdService.findAllStocks();
  }

  @Get('stocks/:code')
  @ApiOperation({ summary: '根据代码获取股票信息' })
  @ApiParam({ name: 'code', description: '股票代码', example: 'AAPL' })
  async getStockByCode(@Param('code') code: string) {
    return await this.cfdService.findStockByCode(code);
  }

  @Get('cryptos')
  @ApiOperation({ summary: '获取所有加密货币信息' })
  async getAllCryptos() {
    return await this.cfdService.findAllCryptos();
  }

  @Get('cryptos/:code')
  @ApiOperation({ summary: '根据代码获取加密货币信息' })
  @ApiParam({ name: 'code', description: '加密货币代码', example: 'BTC' })
  async getCryptoByCode(@Param('code') code: string) {
    return await this.cfdService.findCryptoByCode(code);
  }
}
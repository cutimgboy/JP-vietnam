import { Controller, Get, Post, Param, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { StockTickData } from './entities/stock-tick.entity';

/**
 * 行情数据控制器
 * 提供 HTTP API 接口供客户端轮询获取股票行情数据
 */
@ApiTags('行情数据')
@Controller('api/quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  /**
   * 获取所有股票实时行情数据
   */
  @Get('realtime')
  @ApiOperation({ summary: '获取所有股票实时行情数据' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取股票实时行情数据',
    schema: {
      type: 'object',
      properties: {
        codeList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', description: '股票代码' },
              buy_price: { type: 'number', description: '买入价格' },
              sale_price: { type: 'number', description: '卖出价格' }
            }
          }
        }
      }
    }
  })
  async getAllRealtimeQuotes() {
    try {
      return await this.quoteService.getAllRealtimeQuotes();
    } catch (error) {
      throw new HttpException('获取实时行情数据失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取指定股票的实时行情数据
   */
  @Get('realtime/:code')
  @ApiOperation({ summary: '获取指定股票的实时行情数据' })
  @ApiParam({ 
    name: 'code', 
    description: '股票代码，如: AAPL.US' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取股票实时行情数据',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '股票代码' },
        buy_price: { type: 'number', description: '买入价格' },
        sale_price: { type: 'number', description: '卖出价格' }
      }
    }
  })
  async getRealtimeQuote(@Param('code') code: string) {
    try {
      if (!code) {
        throw new HttpException('股票代码不能为空', HttpStatus.BAD_REQUEST);
      }

      return await this.quoteService.getRealtimeQuote(code);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('获取股票实时行情数据失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取所有订阅的股票行情数据（兼容旧接口）
   */
  @Get()
  @ApiOperation({ summary: '获取所有订阅的股票行情数据（兼容旧接口）' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取股票行情数据',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', description: '股票代码' },
              price: { type: 'string', description: '最新价格' },
              volume: { type: 'string', description: '成交量' },
              tick_time: { type: 'string', description: '时间戳' },
              timestamp: { type: 'string', description: '缓存时间' }
            }
          }
        },
        total: { type: 'number', description: '股票数量' }
      }
    }
  })
  async getAllQuotes() {
    try {
      // 重定向到新的实时行情接口
      return await this.quoteService.getAllRealtimeQuotes();
    } catch (error) {
      throw new HttpException('获取行情数据失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取连接状态信息
   */
  @Get('status/connection')
  @ApiOperation({ summary: '获取 WebSocket 连接状态' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取连接状态信息' 
  })
  async getConnectionStatus() {
    try {
      const status = this.quoteService.getConnectionStatus();
      const subscribedSymbols = this.quoteService.getSubscribedSymbols();

      return {
        connectionStatus: status,
        subscribedSymbols,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException('获取连接状态失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取缓存统计信息
   */
  @Get('status/cache')
  @ApiOperation({ summary: '获取 Redis 缓存统计信息' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取缓存统计信息' 
  })
  async getCacheStats() {
    try {
      const stats = await this.quoteService.getCacheStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException('获取缓存统计信息失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 清理过期缓存
   */
  @Post('maintenance/clean-cache')
  @ApiOperation({ summary: '清理过期的缓存数据' })
  @ApiResponse({ 
    status: 200, 
    description: '成功清理过期缓存' 
  })
  async cleanExpiredCache() {
    try {
      const deletedCount = await this.quoteService.cleanExpiredCache();
      return {
        success: true,
        message: `成功清理 ${deletedCount} 个过期缓存项`,
        deletedCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException('清理过期缓存失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 测试价格计算逻辑
   */
  @Post('test/price-calculation')
  @ApiOperation({ summary: '测试价格计算逻辑' })
  @ApiResponse({ 
    status: 200, 
    description: '成功测试价格计算' 
  })
  async testPriceCalculation(@Body() body: {code: string, price: number}) {
    try {
      const result = await this.quoteService.testPriceCalculation(body.code, body.price);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException('测试价格计算失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
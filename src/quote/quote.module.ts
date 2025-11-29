import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteService } from './quote.service';
import { QuoteController } from './quote.controller';
import { StockRealtimePriceEntity } from './entities/stock-realtime-price.entity';
import { StockPriceChangeEntity } from './entities/stock-price-change.entity';
import { TradingSettingsEntity } from '../cfd/entities/trading-settings.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      StockRealtimePriceEntity,
      StockPriceChangeEntity,
      TradingSettingsEntity,
    ]),
  ],
  controllers: [QuoteController],
  providers: [QuoteService],
  exports: [QuoteService],
})
export class QuoteModule {}
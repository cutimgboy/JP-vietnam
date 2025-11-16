import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CfdController } from './cfd.controller';
import { CfdService } from './cfd.service';
import { TradingSettingsEntity } from './entities/trading-settings.entity';
import { StockInfoEntity } from './entities/stock-info.entity';
import { CryptoInfoEntity } from './entities/crypto-info.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingSettingsEntity,
      StockInfoEntity,
      CryptoInfoEntity,
    ]),
  ],
  controllers: [CfdController],
  providers: [CfdService],
  exports: [CfdService],
})
export class CfdModule {}
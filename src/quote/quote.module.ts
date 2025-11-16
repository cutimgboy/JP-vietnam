import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuoteService } from './quote.service';
import { QuoteGateway } from './quote.gateway';

@Module({
  imports: [ConfigModule],
  providers: [QuoteService, QuoteGateway],
  exports: [QuoteService],
})
export class QuoteModule {}
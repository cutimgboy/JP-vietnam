import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * 股票价格变动记录实体
 * Stock Price Change Entity
 */
@Entity('stock_price_change')
@Index(['code', 'createdAt'])
@Index(['createdAt'])
export class StockPriceChangeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, comment: '股票代码' })
  code: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, comment: '变化前价格' })
  old_price: number;

  @Column({ type: 'decimal', precision: 18, scale: 6, comment: '变化后价格' })
  new_price: number;

  @Column({ type: 'decimal', precision: 18, scale: 6, comment: '价格变动' })
  price_change: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, comment: '变动率' })
  change_rate: number;

  @Column({ type: 'bigint', default: 0, comment: '成交量' })
  volume: number;

  @Column({ type: 'timestamp', comment: 'tick时间戳' })
  tick_time: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;
}
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * 股票实时价格实体
 * Stock Realtime Price Entity
 */
@Entity('stock_realtime_price')
@Index(['code', 'createdAt'])
@Index(['createdAt'])
export class StockRealtimePriceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, comment: '股票代码' })
  code: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, comment: '实时价格' })
  price: number;

  @Column({ type: 'bigint', default: 0, comment: '成交量' })
  volume: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, comment: '成交额' })
  turnover: number;

  @Column({ type: 'timestamp', comment: 'tick时间戳' })
  tick_time: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
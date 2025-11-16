import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 品种交易设置实体
 * Trading Settings Entity
 */
@Entity('trading_settings')
export class TradingSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'orderNum', comment: '序号' })
  orderNum: number;

  @Column({ type: 'varchar', length: 50, name: 'type', comment: '品种类型' })
  type: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'code', comment: '代码' })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'nameCn', comment: '简体名称' })
  nameCn: string;

  @Column({ type: 'varchar', length: 100, name: 'nameEn', comment: '英文名称' })
  nameEn: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'nameVn', comment: '越南语名称' })
  nameVn: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'currencyType', comment: '货币类型' })
  currencyType: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'marginCurrency', comment: '保证金货币' })
  marginCurrency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'decimalPlaces', comment: '小数位' })
  decimalPlaces: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'bidSpread', comment: '买价价差' })
  bidSpread: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'askSpread', comment: '卖价价差' })
  askSpread: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'spread', comment: '价差' })
  spread: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'contractSize', comment: '合约量' })
  contractSize: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'minPriceChange', comment: '交易最小变动' })
  minPriceChange: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'fixedLeverage', comment: '固定杠杆' })
  fixedLeverage: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'liquidationRange', comment: '涨跌爆仓幅度' })
  liquidationRange: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'forcedLiquidationRatio', comment: '强制平仓比例' })
  forcedLiquidationRatio: number;

  @Column({ type: 'text', nullable: true, name: 'tradingHours', comment: '交易时间' })
  tradingHours: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 加密货币基础信息实体
 * Cryptocurrency Information Entity
 */
@Entity('crypto_info')
export class CryptoInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: '序号', comment: '序号' })
  orderNum: number;

  @Column({ type: 'varchar', length: 50, name: 'type', comment: '品种类型' })
  type: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'code', comment: '加密货币代码' })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'nameCn', comment: '简体名称' })
  nameCn: string;

  @Column({ type: 'varchar', length: 200, name: 'nameEn', comment: '英文名称' })
  nameEn: string;

  @Column({ type: 'int', nullable: true, name: 'marketCapRank', comment: '市值排名' })
  marketCapRank: number;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'marketCap', comment: '市值' })
  marketCap: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'fullyDilutedMarketCap', comment: '完全稀释市值' })
  fullyDilutedMarketCap: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'circulatingSupply', comment: '流通数量' })
  circulatingSupply: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'maxSupply', comment: '最大供给量' })
  maxSupply: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'totalSupply', comment: '总量' })
  totalSupply: string;

  @Column({ type: 'date', nullable: true, name: 'launchDate', comment: '发行日期' })
  launchDate?: Date;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'allTimeHigh', comment: '历史最高价' })
  allTimeHigh: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'allTimeLow', comment: '历史最低价' })
  allTimeLow: number;

  @Column({ type: 'text', nullable: true, name: 'descriptionCn', comment: '币种简介（简体）' })
  descriptionCn: string;

  @Column({ type: 'text', nullable: true, name: 'descriptionVn', comment: '币种简介（越南）' })
  descriptionVn: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
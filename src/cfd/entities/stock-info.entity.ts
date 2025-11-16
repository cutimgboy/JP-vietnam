import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 股票基础信息实体
 * Stock Information Entity
 */
@Entity('stock_info')
export class StockInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: '序号', comment: '序号' })
  orderNum: number;

  @Column({ type: 'varchar', length: 50, name: 'type', comment: '品种类型' })
  type: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'code', comment: '股票代码' })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'nameCn', comment: '简体名称' })
  nameCn: string;

  @Column({ type: 'varchar', length: 200, name: 'nameEn', comment: '英文名称' })
  nameEn: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'companyName', comment: '公司名称' })
  companyName: string;

  @Column({ type: 'date', nullable: true, name: 'listingDate', comment: '上市日期' })
  listingDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'issuePrice', comment: '发行价格' })
  issuePrice: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'isinCode', comment: 'ISIN代码' })
  isinCode: string;

  @Column({ type: 'int', nullable: true, name: 'foundedYear', comment: '成立日期（年份）' })
  foundedYear: number;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'ceo', comment: 'CEO' })
  ceo: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'marketCn', comment: '所属市场(简)' })
  marketCn: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'marketEn', comment: '所属市场(英/越)' })
  marketEn: string;

  @Column({ type: 'int', nullable: true, name: 'employees', comment: '员工数量' })
  employees: number;

  @Column({ type: 'date', nullable: true, name: 'fiscalYearEnd', comment: '年结日' })
  fiscalYearEnd?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'address', comment: '公司地址' })
  address: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'city', comment: '城市' })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'provinceCn', comment: '省份（简）' })
  provinceCn: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'provinceEn', comment: '省份(英/越)' })
  provinceEn: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'countryCn', comment: '国家(简)' })
  countryCn: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'countryEn', comment: '国家(英)' })
  countryEn: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'countryVn', comment: '国家(越)' })
  countryVn: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'zipCode', comment: '邮编' })
  zipCode: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'phone', comment: '电话' })
  phone: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'website', comment: '网址' })
  website: string;

  @Column({ type: 'text', nullable: true, name: 'descriptionCn', comment: '公司简介（简体）' })
  descriptionCn: string;

  @Column({ type: 'text', nullable: true, name: 'descriptionVn', comment: '公司简介（越南）' })
  descriptionVn: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
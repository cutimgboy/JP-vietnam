import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 11, unique: true, nullable: true, comment: '手机号' })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true, comment: '邮箱' })
  email: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '昵称' })
  nickname: string | null;

  @Column({ type: 'text', nullable: true, comment: '头像' })
  avatar: string | null;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true, comment: 'Google ID' })
  googleId: string | null;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true, comment: 'Facebook ID' })
  facebookId: string | null;

  @Column({ type: 'tinyint', default: 1, comment: '状态：1-正常，0-禁用' })
  status: number;

  @CreateDateColumn({ type: 'timestamp', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ type: 'timestamp', comment: '更新时间' })
  updateTime: Date;
}

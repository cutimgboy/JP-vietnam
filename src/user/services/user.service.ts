import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * 根据手机号查找用户
   */
  async findByPhone(phone: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { phone } });
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * 根据 Google ID 查找用户
   */
  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { googleId } });
  }

  /**
   * 根据 Facebook ID 查找用户
   */
  async findByFacebookId(facebookId: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { facebookId } });
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: number): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * 创建新用户（通过手机号）
   */
  async create(phone: string): Promise<UserEntity> {
    const user = this.userRepository.create({
      phone,
      nickname: `用户${phone.slice(-4)}`,
      status: 1,
    });
    return await this.userRepository.save(user);
  }

  /**
   * 创建新用户（通过邮箱）
   */
  async createByEmail(email: string): Promise<UserEntity> {
    const user = this.userRepository.create({
      email,
      phone: null, // 邮箱注册时手机号为空，后续可补充
      nickname: `用户${email.split('@')[0]}`,
      status: 1,
    });
    return await this.userRepository.save(user);
  }

  /**
   * 创建新用户（通过第三方登录）
   */
  async createByOAuth(data: {
    provider: 'google' | 'facebook';
    providerId: string;
    email?: string;
    nickname: string;
    avatar?: string;
  }): Promise<UserEntity> {
    const user = this.userRepository.create({
      phone: null,
      email: data.email ?? null,
      nickname: data.nickname,
      avatar: data.avatar ?? null,
      googleId: data.provider === 'google' ? data.providerId : null,
      facebookId: data.provider === 'facebook' ? data.providerId : null,
      status: 1,
    });
    return await this.userRepository.save(user);
  }

  /**
   * 更新用户信息
   */
  async update(id: number, data: Partial<UserEntity>): Promise<UserEntity | null> {
    await this.userRepository.update(id, data);
    return await this.findById(id);
  }

  /**
   * 验证用户状态
   */
  async validateUserStatus(user: UserEntity): Promise<boolean> {
    return user.status === 1;
  }
}
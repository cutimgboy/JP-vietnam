import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get('FACEBOOK_APP_SECRET') || '',
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL') || '',
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    
    const user = await this.authService.validateOAuthLogin({
      provider: 'facebook',
      providerId: id,
      email: emails && emails[0] ? emails[0].value : undefined,
      nickname: name ? `${name.givenName} ${name.familyName}` : `User${id.slice(-4)}`,
      avatar: photos && photos[0] ? photos[0].value : undefined,
    });

    done(null, user);
  }
}
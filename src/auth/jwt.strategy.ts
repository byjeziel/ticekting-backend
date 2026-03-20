import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('VITE_AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }) as any,
      audience: configService.get('VITE_AUTH0_AUDIENCE'),
      issuer: `https://${configService.get('VITE_AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    const userRecord = await this.userService.findByAuth0Id(payload.sub);
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: userRecord?.role ?? null,
      userId: (userRecord as any)?._id?.toString() ?? null,
    };
  }
}

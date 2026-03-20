import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from './roles.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PassportModule, ConfigModule, UserModule],
  providers: [JwtStrategy, RolesGuard],
  exports: [JwtStrategy, RolesGuard],
})
export class AuthModule {}
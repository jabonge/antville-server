import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AnonymousStrategy } from './strategies/anonymous.strategy';

@Module({
  imports: [UserModule, PassportModule],
  providers: [AuthService, JwtStrategy, LocalStrategy, AnonymousStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

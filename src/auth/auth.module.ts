import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from './../user/user.module';
import { JwtGqlWsAuthGuard, JwtGqlAuthGuard } from './guards/auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthResolver } from './auth.resolver';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_KEY');
        return { secret };
      },
      inject: [ConfigService],
    }),
    UserModule,
    PassportModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    JwtGqlWsAuthGuard,
    JwtGqlAuthGuard,
    AuthResolver,
  ],
  controllers: [AuthController],
})
export class AuthModule {}

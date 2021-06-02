import { Module } from '@nestjs/common';
import { HtmlService } from './html.service';
import { HtmlController } from './html.controller';
import { UserModule } from '../domain/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [HtmlController],
  providers: [HtmlService],
})
export class HtmlModule {}

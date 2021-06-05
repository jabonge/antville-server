import { FcmService } from './fcm.service';
import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../../domain/user/user.module';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [
    {
      provide: 'MESSAGING',
      useFactory: (configService: ConfigService) => {
        const app = admin.initializeApp({
          credential: admin.credential.cert({
            clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
            privateKey: configService.get<string>('FIREBASE_PRIVATE_KEY'),
            projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
          }),
        });
        return app.messaging();
      },
      inject: [ConfigService],
    },
    FcmService,
  ],
  exports: [FcmService],
})
export class FcmModule {}

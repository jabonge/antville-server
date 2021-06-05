import { verifyEmailRequest } from '../../util/ses/index';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import { changePasswordEmailRequest } from '../../util/ses';

@Injectable()
export class SesService {
  private readonly ses: AWS.SESV2;
  constructor(private readonly configService: ConfigService) {
    this.ses = new AWS.SESV2({
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY'),
        secretAccessKey: this.configService.get('AWS_SECRET_KEY'),
      },
      region: this.configService.get('AWS_S3_REGION'),
    });
  }

  async sendPasswordEmail(token: string, nickname: string, email: string) {
    return this.ses.sendEmail(
      changePasswordEmailRequest(token, nickname, email),
      (err, _data) => {
        if (err) {
          throw err;
        }
        return;
      },
    );
  }

  async verifyEmail(token: string, nickname: string, email: string) {
    return this.ses.sendEmail(
      verifyEmailRequest(token, nickname, email),
      (err, _data) => {
        if (err) {
          console.log(err);
        }
        return;
      },
    );
  }
}

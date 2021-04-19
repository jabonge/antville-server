import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import AWS from 'aws-sdk';
import MulterS3 from 'multer-s3';

@Injectable()
export class UploadService implements MulterOptionsFactory {
  private s3 = new AWS.S3();

  constructor(private readonly confingService: ConfigService) {
    AWS.config.update({
      accessKeyId: this.confingService.get('AWS_ACCESS_KEY'),
      secretAccessKey: this.confingService.get('AWS_SECRET_KEY'),
      region: this.confingService.get('AWS_S3_REGION'),
    });
  }

  createMulterOptions(): MulterModuleOptions | Promise<MulterModuleOptions> {
    const multerS3Storage = MulterS3({
      s3: this.s3,
      bucket: this.confingService.get('AWS_BUCKET'),
      acl: 'public-read',
      key: (_, file, cb) => {
        const fileExtension = file.originalname.split('.').pop();
        return cb(null, `${file.fieldname}/${Date.now()}.${fileExtension}`);
      },
    });

    return {
      storage: multerS3Storage,
      fileFilter: (_, file, cb) => {
        if (file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('UnSupported File'), false);
        }
      },
      limits: {
        fileSize: 1024 * 1024 * 10,
      },
    };
  }
}

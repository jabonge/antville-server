import { MigrationInterface, QueryRunner } from 'typeorm';
import { CommentImg } from '../../domain/comment/entities/comment-img.entity';

export class imageRename1625560047844 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const images = await queryRunner.connection.manager.find(CommentImg, {
      select: ['id', 'image'],
    });
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const url = new URL(image.image);
      const newUrl =
        'https://antville-s3.s3.ap-northeast-2.amazonaws.com' +
        '/development' +
        url.pathname;
      image.image = newUrl;
      await queryRunner.connection.manager.save(image);
    }
  }

  public async down(_: QueryRunner): Promise<void> {
    return;
  }
}

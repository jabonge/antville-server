import { MigrationInterface, QueryRunner } from 'typeorm';

export class ADDCOLUMN1627545148058 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.connection.query(
      'ALTER TABLE `user` ADD `isRecommendUser` tinyint UNSIGNED NULL',
    );
    await queryRunner.connection.query(
      'ALTER TABLE `user` ADD `isRecommendPostUser` tinyint NOT NULL DEFAULT 0',
    );
    await queryRunner.connection.query(
      'ALTER TABLE `stock` ADD `logo` varchar(200) NULL',
    );
    await queryRunner.connection.query(
      'CREATE INDEX `IDX_94c46efb974e7796656b98540d` ON `user` (`isRecommendUser`)',
    );
    await queryRunner.connection.query(
      'CREATE INDEX `IDX_8a8c51910620d7a065332768c0` ON `user` (`isRecommendPostUser`)',
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    return;
  }
}

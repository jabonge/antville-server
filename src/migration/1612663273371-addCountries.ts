import { Country } from '../domain/stock/entities/country.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCountries1612663273371 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const countries = await queryRunner.manager.find(Country);
    if (countries.length <= 0) {
      const korea = new Country();
      korea.code = 'KR';
      korea.krName = '대한민국';
      korea.usName = 'KOREA';
      const usa = new Country();
      usa.code = 'US';
      usa.krName = '미국';
      usa.usName = 'UNITED STATES';
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('country')
        .values([usa, korea])
        .execute();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const countries = await queryRunner.manager.find(Country);
    if (countries.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('country')
        .execute();
    }
  }
}

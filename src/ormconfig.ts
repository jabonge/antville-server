import { getEnvFilePath } from './util';
import * as dotenv from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

dotenv.config({ path: process.cwd() + getEnvFilePath() });

const ormConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: process.env.NODE_ENV === 'local',
  synchronize: process.env.NODE_ENV === 'local',
  timezone: process.env.DB_TIMEZONE,
  entities: [process.cwd() + '/dist/**/*.entity{.ts,.js}'],
  // migrations: ['src/infra/migration/*.ts'],
  // cli: {
  //   migrationsDir: 'src/infra/migration',
  // },
};

export default ormConfig;

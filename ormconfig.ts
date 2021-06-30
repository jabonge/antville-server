import { ConnectionOptions } from 'typeorm';
import { getEnvFilePath } from './src/util';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.cwd() + getEnvFilePath() });

const ormConfig: ConnectionOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: process.env.NODE_ENV === 'local',
  synchronize: process.env.NODE_ENV === 'local',
  timezone: process.env.DB_TIMEZONE,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/infra/migration/*.ts'],
  cli: {
    migrationsDir: 'src/infra/migration',
  },
};

export default ormConfig;

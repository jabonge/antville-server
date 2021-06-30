import { ConnectionOptions } from 'typeorm';
import { getEnvFilePath } from '../util';
import * as dotenv from 'dotenv';

console.log(process.cwd() + getEnvFilePath());
dotenv.config({ path: process.cwd() + getEnvFilePath() });

const ormConfig: ConnectionOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: true,
  synchronize: process.env.NODE_ENV === 'local',
  timezone: process.env.DB_TIMEZONE,
  entities: [process.cwd() + '/src/**/*.entity{.ts,.js}'],
};

export default ormConfig;

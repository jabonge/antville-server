import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import CryptoSyncBot from './syncbot';
import ormConfig from '../ormconfig';
import { getEnvFilePath } from '../../util';

dotenv.config({ path: process.cwd() + getEnvFilePath() });

createConnection(ormConfig).then(async (connection) => {
  const cryptoSyncBot = new CryptoSyncBot();
  await cryptoSyncBot.syncAll();
  await cryptoSyncBot.setMarketCap();
  connection.close();
});

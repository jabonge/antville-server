import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
// import CryptoSyncBot from './syncbot';
import ormConfig from '../ormconfig';
import { getEnvFilePath } from '../../util';
import { updateLogo } from '../utils';

dotenv.config({ path: process.cwd() + getEnvFilePath() });

createConnection(ormConfig).then(async (connection) => {
  // const cryptoSyncBot = new CryptoSyncBot();
  // await cryptoSyncBot.syncAll();
  // await cryptoSyncBot.setMarketCap();
  await updateLogo(__dirname, 'crypto');
  connection.close();
});

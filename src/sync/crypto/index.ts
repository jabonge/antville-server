import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import CryptoSyncBot from './syncbot';

dotenv.config({ path: process.cwd() + '/.env.dev' });

createConnection().then(async (connection) => {
  const cryptoSyncBot = new CryptoSyncBot();
  await cryptoSyncBot.syncAll();
  await cryptoSyncBot.setMarketCap();
  connection.close();
});

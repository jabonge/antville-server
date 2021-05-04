import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import NaverAbroadSyncBot from './aboardSyncbot';
import NaverDomesticSyncBot from './domesticSyncbot';

dotenv.config({ path: process.cwd() + '/.env.dev' });

createConnection().then(async (connection) => {
  const abroadSyncBot = new NaverAbroadSyncBot();
  const domesticSyncBot = new NaverDomesticSyncBot();
  await abroadSyncBot.syncAll();
  await domesticSyncBot.syncAll();
  connection.close();
});

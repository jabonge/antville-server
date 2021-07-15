import { createConnection } from 'typeorm';
import NaverAbroadSyncBot from './aboardSyncbot';
import NaverDomesticSyncBot from './domesticSyncbot';
import ormConfig from '../ormconfig';

createConnection(ormConfig).then(async (connection) => {
  const abroadSyncBot = new NaverAbroadSyncBot();
  const domesticSyncBot = new NaverDomesticSyncBot();
  await abroadSyncBot.syncAll();
  await domesticSyncBot.syncAll();
  connection.close();
});

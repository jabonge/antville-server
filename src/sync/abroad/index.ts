import { createConnection } from 'typeorm';
import AbroadSyncBot from './syncbot';

import ormConfig from '../ormconfig';

createConnection(ormConfig).then(async (connection) => {
  const abroadSyncBot = new AbroadSyncBot();
  // await abroadSyncBot.syncAll();
  // await abroadSyncBot.setEtf();
  await abroadSyncBot.addSymbols(['DIDI']);
  connection.close();
});

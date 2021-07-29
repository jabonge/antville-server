import { createConnection } from 'typeorm';
// import AbroadSyncBot from './syncbot';

import ormConfig from '../ormconfig';
import { updateLogo } from '../utils';

createConnection(ormConfig).then(async (connection) => {
  // const abroadSyncBot = new AbroadSyncBot();
  // await abroadSyncBot.syncAll();
  // await abroadSyncBot.setEtf();
  // await abroadSyncBot.addSymbols(['GOTU', 'BODY']);
  await updateLogo(__dirname, 'us');
  connection.close();
});

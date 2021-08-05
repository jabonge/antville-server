import { createConnection } from 'typeorm';

import ormConfig from '../ormconfig';
import { updateLogo } from '../utils';
// import KoreaSyncBot from './syncbot';

createConnection(ormConfig).then(async (connection) => {
  // const koreaSyncBot = new KoreaSyncBot();
  // await koreaSyncBot.downloadAllStockLogo();
  await updateLogo(__dirname, 'korea');
  connection.close();
});

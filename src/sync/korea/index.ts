import { createConnection } from 'typeorm';

import ormConfig from '../ormconfig';
import KoreaSyncBot from './syncbot';
// import KoreaSyncBot from './syncbot';

createConnection(ormConfig).then(async (connection) => {
  const koreaSyncBot = new KoreaSyncBot();
  // await koreaSyncBot.downloadAllStockLogo();
  await koreaSyncBot.addSymbol(
    '323410',
    'KOSPI',
    '카카오뱅크',
    '카카오뱅크',
    372954,
    'https://antville-s3.s3.ap-northeast-2.amazonaws.com/logos/korea/323410.png',
  );
  connection.close();
});

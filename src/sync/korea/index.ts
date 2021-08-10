import { createConnection } from 'typeorm';

import ormConfig from '../ormconfig';
import KoreaSyncBot from './syncbot';
// import KoreaSyncBot from './syncbot';

createConnection(ormConfig).then(async (connection) => {
  const koreaSyncBot = new KoreaSyncBot();
  // await koreaSyncBot.downloadAllStockLogo();
  await koreaSyncBot.addSymbol(
    '259960',
    'KOSPI',
    '크래프톤',
    '크래프톤',
    221997,
    'https://antville-s3.s3.ap-northeast-2.amazonaws.com/logos/korea/259960.png',
  );
  connection.close();
});

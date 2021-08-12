import { createConnection } from 'typeorm';

import ormConfig from '../ormconfig';
import KoreaSyncBot from './syncbot';
// import KoreaSyncBot from './syncbot';

createConnection(ormConfig).then(async (connection) => {
  const koreaSyncBot = new KoreaSyncBot();
  // await koreaSyncBot.downloadAllStockLogo();
  await koreaSyncBot.addSymbol(
    '376980',
    'KOSDAQ',
    '원티드랩',
    '원티드랩',
    4280,
    'https://antville-s3.s3.ap-northeast-2.amazonaws.com/logos/korea/376980.png',
  );
  connection.close();
});

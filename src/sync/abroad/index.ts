import { createConnection } from 'typeorm';
import AbroadSyncBot from './syncbot';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.cwd() + '/.env.dev' });

createConnection().then(async (connection) => {
  const abroadSyncBot = new AbroadSyncBot();
  await abroadSyncBot.syncStock('NYSE');
  connection.close();
});

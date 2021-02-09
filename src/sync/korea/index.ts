import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import KoreaSyncBot from './syncbot';

dotenv.config({ path: process.cwd() + '/.env.dev' });

createConnection().then(async (connection) => {
  const syncBot = new KoreaSyncBot();
  await syncBot.syncAll();
  connection.close();
});

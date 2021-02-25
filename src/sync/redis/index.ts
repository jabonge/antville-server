import { IUpbitWsCryptoResponse } from './interface';
import { ICrypto } from '../crypto/interfaces';
import redis from 'redis';
import { getQuotes } from '../abroad/api/getQuotes';
import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { StockMeta } from '../../stock/entities/stock-meta.entity';

const upBitApi = axios.create({
  baseURL: 'https://api.upbit.com/v1',
});
dotenv.config({ path: process.cwd() + '/.env.dev' });
const client = redis.createClient(6379, '127.0.0.1');
const publisher = redis.createClient(6379, '127.0.0.1');
const subscriber = redis.createClient(6379, '127.0.0.1');
const upBitWebSocket = new WebSocket('wss://api.upbit.com/websocket/v1');

client.on('error', function (err) {
  console.log(err);
});

subscriber.subscribe('stocks');
subscriber.on('subscribe', (channel, count) => {
  console.log('subscribe');
});
subscriber.on('message', (channel, message) => {
  console.log(JSON.parse(message));
});

const getCryptoList = () => {
  return upBitApi.get<[ICrypto]>('/market/all');
};

const init = async () => {
  const cryptos = await getCryptoList();

  const krwList = cryptos.data
    .filter((v) => {
      return v.market.substring(0, 3) === 'KRW';
    })
    .map((v) => v.market);

  upBitWebSocket.on('open', () => {
    upBitWebSocket.send(
      JSON.stringify([
        { ticket: 'unique-ticker-valuetalk' },
        { type: 'ticker', codes: krwList },
      ]),
      (err) => {
        console.log(err);
      },
    );
  });

  upBitWebSocket.on('message', (buf) => {
    const crypto: IUpbitWsCryptoResponse = JSON.parse(
      Buffer.from(buf.toString()).toString(),
    );
    const stockMeta = new StockMeta().upbitWsCryptoResponseToStockMeta(crypto);
    const stockMetaString = JSON.stringify(stockMeta);
    client.hset('stocks', crypto.code, stockMetaString);
    publisher.publish('stocks', stockMetaString);
  });

  upBitWebSocket.on('close', () => {
    subscriber.unsubscribe();
    subscriber.quit();
    publisher.quit();
    client.quit();
  });

  setTimeout(() => {
    upBitWebSocket.close();
  }, 3000);
};

// const init = async () => {
//   const quotes = await getQuotes('nyse');
//   const quoteArrayForRedis = quotes
//     .map((v) => {
//       return [v.symbol, JSON.stringify(v)];
//     })
//     .flat();

//   client.hmset('stocks', quoteArrayForRedis, (err) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(new Date());
//     }
//   });
// };

init();

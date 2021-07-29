import { getMarketCapList } from './api/getMarketCap';
import { Stock, StockType } from '../../domain/stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { getCryptoList } from './api/getAllCrypto';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';
import { Exchange } from '../../domain/stock/entities/exchange.entity';
import path from 'path';
import * as fs from 'fs/promises';
import { downloadStockLogo } from '../utils/download_logo';

const logo_ticker_path = path.resolve(__dirname, 'logo_ticker.txt');
//Upbit Api
class CryptoSyncBot {
  async setMarketCap() {
    const marketCaps = await getMarketCapList();
    for (let i = 0; i < marketCaps.length; i++) {
      const crypto = marketCaps[i];
      if (crypto.marketCap) {
        const stock = await getRepository(Stock).findOne({
          where: { krName: crypto.koreanName },
          relations: ['stockMeta'],
        });
        if (stock) {
          stock.stockMeta.marketCap = Math.round(
            Math.round(crypto.marketCap) / 100000000,
          );
          await getRepository(Stock).save(stock);
        }
      }
    }
  }
  async syncAll() {
    const cryptos = await getCryptoList();
    const krwList = cryptos.filter((v) => {
      return v.market.substring(0, 3) === 'KRW';
    });
    const exchangeName = 'UPbit';
    let exchange;
    exchange = await getRepository(Exchange).findOne({
      where: { name: exchangeName },
    });
    if (!exchange) {
      exchange = new Exchange();
      exchange.name = exchangeName;
      exchange.countryCode = 'KR';
      await getRepository(Exchange).save(exchange);
    }

    for (let i = 0; i < krwList.length; i++) {
      const crypto = krwList[i];
      const splitMarketName = crypto.market.split('-');
      const symbol = `${splitMarketName[1]}/${splitMarketName[0]}`;
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
      });
      if (!stock) {
        stock = new Stock();
        stock.type = StockType.CRYPTO;
        stock.krName = crypto.korean_name;
        stock.enName = crypto.english_name;
        stock.cashTagName = crypto.korean_name;
        stock.symbol = symbol;
        stock.exchange = exchange;
        stock.stockCount = new StockCount();
        stock.stockMeta = new StockMeta();
        await getRepository(Stock).save(stock);
      } else {
        stock.cashTagName = crypto.korean_name;
        stock.symbol = symbol;
        await getRepository(Stock).save(stock);
      }
    }
  }

  async downloadAllCryptoLogo() {
    const cryptos = await getCryptoList();
    const krwList = cryptos.filter((v) => {
      return v.market.substring(0, 3) === 'KRW';
    });
    for (let i = 0; i < krwList.length; i++) {
      const crypto = krwList[i];
      const splitMarketName = crypto.market.split('-');
      const symbol = `${splitMarketName[1]}/${splitMarketName[0]}`;
      await this.downloadCryptoStockLogo(symbol);
    }
  }

  async downloadCryptoStockLogo(symbol: string) {
    const ticker = symbol.split('/')[0];
    const imageDir = path.join(
      __dirname,
      '../',
      'logos/crypto',
      `${ticker}.png`,
    );
    try {
      await downloadStockLogo(
        `https://static.upbit.com/logos/${ticker}.png`,
        imageDir,
      );
      fs.appendFile(logo_ticker_path, `${symbol}\n`, 'utf8');
      // await getRepository(Stock).save(stock);
    } catch (err) {
      console.log(`err: ${err} ticker: ${ticker}`);
    }
  }
}
// stock.logo = `https://antville-s3.s3.ap-northeast-2.amazonaws.com/logos/crypto/${ticker}.png`;

export default CryptoSyncBot;

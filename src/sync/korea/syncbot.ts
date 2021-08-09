import { downloadStockLogo } from '../utils/download_logo';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getKoreaStockList } from './api/getList';
import { getRepository } from 'typeorm';
import { Stock } from '../../domain/stock/entities/stock.entity';
import { Exchange } from '../../domain/stock/entities/exchange.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));
const exchanges = ['kospi', 'kosdaq'];
const logo_ticker_path = path.resolve(__dirname, 'logo_ticker.txt');
class KoreaSyncBot {
  async downloadAllStockLogo() {
    for (let i = 0; i < exchanges.length; i++) {
      const list = await getKoreaStockList(exchanges[i]);
      const symbols = list.isuLists.map((q) => q.isuSrtCd);
      for (let j = 0; j < symbols.length; j++) {
        await this.downloadUsStockLogo(symbols[j]);
        await sleep(200);
      }
    }
  }

  async downloadUsStockLogo(symbol: string) {
    const imageDir = path.join(
      __dirname,
      '../',
      'logos/korea',
      `${symbol}.png`,
    );
    try {
      await downloadStockLogo(
        `https://money-talk-test.s3.amazonaws.com/stock-logo/${symbol}.png`,
        imageDir,
      );
      fs.appendFile(logo_ticker_path, `${symbol}\n`, 'utf8');
    } catch (err) {
      console.log(`err: ${err} symbol: ${symbol}`);
    }
  }

  async addSymbol(
    symbol: string,
    exchangeName: string,
    krName: string,
    cashTagName: string,
    marketCap: number,
    logo: string,
  ) {
    let stock = await getRepository(Stock).findOne({
      where: { symbol },
    });
    if (!stock) {
      const exchange = await getRepository(Exchange).findOne({
        where: { name: exchangeName },
      });
      stock = new Stock();
      stock.type = null;
      stock.symbol = symbol;
      stock.enName = krName;
      stock.krName = krName;
      stock.cashTagName = cashTagName;
      stock.exchange = exchange;
      stock.logo = logo;
      stock.stockMeta = new StockMeta();
      stock.stockMeta.marketCap = marketCap;
      stock.stockCount = new StockCount();
      await getRepository(Stock).save(stock);
    }
  }
}

export default KoreaSyncBot;

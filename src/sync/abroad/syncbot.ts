import { Exchange } from '../../domain/stock/entities/exchange.entity';
import { Stock, StockType } from '../../domain/stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { getQuote, getQuotes } from './api/getQuotes';
import { getEtfList } from './api/getEtfList';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';
import { downloadStockLogo } from '../utils/download_logo';
import * as path from 'path';
import * as fs from 'fs/promises';

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));
const usExchanges = ['NYSE', 'NASDAQ', 'AMEX'];
const logo_ticker_path = path.resolve(__dirname, 'logo_ticker.txt');
class AbroadSyncBot {
  async syncAll() {
    for (let i = 0; i < usExchanges.length; i++) {
      await this.syncStock(usExchanges[i]);
    }
  }
  async setEtf() {
    const etfList = await getEtfList();
    for (let i = 0; i < etfList.length; i++) {
      const etf = etfList[i];
      const stock = await getRepository(Stock).findOne({
        where: { symbol: etf.symbol },
      });
      if (stock) {
        stock.type = StockType.ETF;
        await getRepository(Stock).save(stock);
      }
    }
  }
  async syncStock(exchangeName: string, isEtf = false) {
    let exchange;
    if (!isEtf) {
      exchange = await getRepository(Exchange).findOne({
        where: { name: exchangeName },
      });
      if (!exchange) {
        exchange = new Exchange();
        exchange.name = exchangeName;
        exchange.countryCode = 'US';
        await getRepository(Exchange).save(exchange);
      }
    }

    const quotes = await getQuotes(exchangeName);

    //quotes.length
    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i];
      const symbol = quote.symbol;
      if (!quote.name) {
        continue;
      }
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
        relations: ['stockMeta'],
      });
      if (!stock) {
        stock = new Stock();
        stock.type = isEtf ? StockType.ETF : null;
        stock.symbol = symbol;
        stock.enName = quote.name;
        stock.krName = quote.name;
        stock.cashTagName = symbol;
        stock.exchange = exchange;
        stock.stockMeta = new StockMeta();
        stock.stockMeta.marketCap = Math.round(
          Math.round(quote.marketCap) / 100000,
        );
        stock.stockCount = new StockCount();
        await getRepository(Stock).save(stock);
      } else if (stock) {
        stock.stockMeta.marketCap = Math.round(
          Math.round(quote.marketCap) / 100000,
        );
        await getRepository(Stock).save(stock);
      }
    }
  }
  async addSymbols(symbols: string[]) {
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const quote = await getQuote(symbol);
      if (!quote.name) {
        continue;
      }
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
      });
      if (!stock) {
        const exchange = await getRepository(Exchange).findOne({
          where: { name: quote.exchange },
        });
        stock = new Stock();
        stock.type = null;
        stock.symbol = symbol;
        stock.enName = quote.name;
        stock.krName = quote.name;
        stock.cashTagName = symbol;
        stock.exchange = exchange;
        stock.stockMeta = new StockMeta();
        stock.stockMeta.marketCap = Math.round(
          Math.round(quote.marketCap) / 100000,
        );
        stock.stockCount = new StockCount();
        await getRepository(Stock).save(stock);
      }
    }
  }

  async downloadAllStockLogo() {
    for (let i = 0; i < usExchanges.length; i++) {
      const quotes = await getQuotes(usExchanges[i]);
      const symbols = quotes.map((q) => q.symbol);
      for (let j = 0; j < symbols.length; j++) {
        await this.downloadUsStockLogo(symbols[j]);
        await sleep(200);
      }
    }
  }

  async downloadUsStockLogo(symbol: string) {
    const imageDir = path.join(__dirname, '../', 'logos/us', `${symbol}.png`);
    try {
      await downloadStockLogo(
        `https://financialmodelingprep.com/image-stock/${symbol}.png`,
        imageDir,
      );

      fs.appendFile(logo_ticker_path, `${symbol}\n`, 'utf8');
    } catch (err) {
      console.log(`err: ${err} symbol: ${symbol}`);
    }
  }
}

export default AbroadSyncBot;

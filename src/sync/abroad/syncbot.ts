import { Exchange } from '../../domain/stock/entities/exchange.entity';
import { Stock, StockType } from '../../domain/stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { getQuotes } from './api/getQuotes';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';

class AbroadSyncBot {
  async syncAll() {
    const usExchanges = ['NYSE', 'NASDAQ', 'AMEX'];

    for (let i = 0; i < usExchanges.length; i++) {
      await this.syncStock(usExchanges[i]);
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
    for (let i = 0; i < 10; i++) {
      const quote = quotes[i];
      const symbol = quote.symbol;
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
      });
      if (!stock) {
        stock = new Stock();
        stock.type = isEtf ? StockType.ETF : null;
        stock.symbol = symbol;
        stock.enName = quote.name;
        stock.krName = quote.name;
        stock.exchange = exchange;
        stock.stockMeta = new StockMeta();
        stock.stockMeta.marketCap = quote.marketCap;
        stock.stockCount = new StockCount();
        await getRepository(Stock).save(stock);
      }
    }
  }
}

export default AbroadSyncBot;

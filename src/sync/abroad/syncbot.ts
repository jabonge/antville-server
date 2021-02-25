import { Country } from './../../stock/entities/country.entity';
import { Exchange } from './../../stock/entities/exchange.entity';
import { Stock, StockType } from './../../stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { getQuotes } from './api/getQuotes';

class AbroadSyncBot {
  async syncAll() {
    const usExchanges = ['NYSE', 'NASDAQ', 'AMEX'];

    for (let i = 0; i < usExchanges.length; i++) {
      await this.syncStock(usExchanges[i]);
    }
  }
  async syncStock(exchangeName: string, isEtf = false) {
    const country = await getRepository(Country).findOne({
      where: { code: 'US' },
    });
    let exchange;
    if (!isEtf) {
      exchange = await getRepository(Exchange).findOne({
        where: { name: exchangeName },
      });
      if (!exchange) {
        exchange = new Exchange();
        exchange.name = exchangeName;
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
        stock.country = country;
        stock.exchange = exchange;
        await getRepository(Stock).save(stock);
      }
    }
  }
}

export default AbroadSyncBot;

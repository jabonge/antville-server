import { Country } from './../../stock/entities/country.entity';
import { Exchange } from './../../stock/entities/exchange.entity';
import { StockMeta } from './../../stock/entities/stock-meta.entity';
import { Stock } from './../../stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { getQuotes } from './api/getQuotes';
import { getStockProfile } from './api/getProfile';

class AbroadSyncBot {
  async syncAll() {
    const usExchanges = ['NYSE', 'NASDAQ', 'AMEX'];
    for (let i = 0; i < usExchanges.length; i++) {
      await this.syncStock(usExchanges[i]);
    }
  }
  async syncStock(exchangeName: string) {
    const country = await getRepository(Country).findOne({
      where: { code: 'US' },
    });
    let exchange = await getRepository(Exchange).findOne({
      where: { name: exchangeName },
    });
    if (!exchange) {
      exchange = new Exchange();
      exchange.country = country;
      exchange.name = exchangeName;
      await getRepository(Exchange).save(exchange);
    }

    const quotes = await getQuotes(exchangeName);
    //TODO i < quotes.length;
    for (let i = 0; i < 7; i++) {
      const symbol = quotes[i].symbol;
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
      });
      if (!stock) {
        const profile = await getStockProfile(symbol);
        if (!profile) continue;
        stock = new Stock();
        stock.symbol = profile.symbol;
        stock.sector = profile.sector;
        stock.ipoDate = new Date(profile.ipoDate);
        stock.enName = profile.companyName;
        stock.krName = profile.companyName;
        stock.exchange = exchange;
        await getRepository(Stock).save(stock);

        const stockMeta = new StockMeta();
        stockMeta.latest = quotes[i].price;
        stockMeta.marketCap = quotes[i].marketCap;
        stockMeta.dayHigh = quotes[i].dayHigh;
        stockMeta.dayLow = quotes[i].dayLow;
        stockMeta.open = quotes[i].open;
        stockMeta.previousClose = quotes[i].previousClose;
        stockMeta.stock = stock;
        await getRepository(StockMeta).save(stockMeta);
      }
    }
  }
}

export default AbroadSyncBot;

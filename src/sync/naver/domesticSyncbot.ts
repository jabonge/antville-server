import { getRepository } from 'typeorm';
import { Exchange } from '../../domain/stock/entities/exchange.entity';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';
import { Stock } from '../../domain/stock/entities/stock.entity';
import { getNaverDomesticStocks } from './api/getDomesticStocks';
import { DomesticStock } from './interfaces';

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

class NaverDomesticSyncBot {
  async syncAll() {
    const koExchanges = ['KOSPI', 'KOSDAQ'];

    for (let i = 0; i < koExchanges.length; i++) {
      await this.syncStock(koExchanges[i]);
    }
  }
  async syncStock(exchangeName: string) {
    let exchange = await getRepository(Exchange).findOne({
      where: { name: exchangeName },
    });
    if (!exchange) {
      exchange = new Exchange();
      exchange.name = exchangeName;
      exchange.countryCode = 'KR';
      await getRepository(Exchange).save(exchange);
    }
    const page = 1;
    const pageSize = 50;
    const stocks = [];

    const firstResponse = await getNaverDomesticStocks(
      exchangeName,
      page,
      pageSize,
    );
    const totalCount = firstResponse.totalCount;
    const totalPage = parseInt(`${totalCount / pageSize}`, 10);
    stocks.push(...firstResponse.stocks);
    for (let i = 2; i <= totalPage; i++) {
      const response = await getNaverDomesticStocks(exchangeName, i, pageSize);
      stocks.push(...response.stocks);
      await sleep(2000);
    }
    for (let i = 0; i < stocks.length; i++) {
      const naverStock = stocks[i] as DomesticStock;
      const symbol = naverStock.itemCode;
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
        relations: ['stockMeta'],
      });
      if (!stock) {
        stock = new Stock();
        stock.symbol = symbol;
        stock.enName = naverStock.stockName;
        stock.krName = naverStock.stockName;
        stock.cashTagName = naverStock.stockName.split(' ').join('');
        stock.exchange = exchange;
        stock.stockMeta = new StockMeta();
        if (naverStock.marketValue) {
          stock.stockMeta.marketCap = parseInt(
            naverStock.marketValue.split(',').join(''),
            10,
          );
        }
        stock.stockCount = new StockCount();
        await getRepository(Stock).save(stock);
      } else {
        stock.cashTagName = naverStock.stockName.split(' ').join('');
        if (naverStock.marketValue) {
          stock.stockMeta.marketCap = parseInt(
            naverStock.marketValue.split(',').join(''),
            10,
          );
        }
        await getRepository(Stock).save(stock);
      }
    }
  }
}

export default NaverDomesticSyncBot;

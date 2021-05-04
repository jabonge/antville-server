import { getRepository } from 'typeorm';
import { Stock } from '../../domain/stock/entities/stock.entity';
import { getNaverAboardStocks } from './api/getAboardStocks';
import { NaverAboardStock } from './interfaces';

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

class NaverAbroadSyncBot {
  async syncAll() {
    const usExchanges = ['NYSE', 'NASDAQ', 'AMEX'];

    for (let i = 0; i < usExchanges.length; i++) {
      await this.syncStock(usExchanges[i]);
    }
  }
  async syncStock(exchangeName: string) {
    const page = 1;
    const pageSize = 50;
    const stocks = [];

    const firstResponse = await getNaverAboardStocks(
      exchangeName,
      page,
      pageSize,
    );
    const totalCount = firstResponse.totalCount;
    const totalPage = parseInt(`${totalCount / pageSize}`, 10);
    stocks.push(...firstResponse.stocks);

    for (let i = 2; i <= totalPage; i++) {
      const response = await getNaverAboardStocks(exchangeName, i, pageSize);
      stocks.push(...response.stocks);
      console.log(stocks.length);
      await sleep(2000);
    }

    for (let i = 0; i < stocks.length; i++) {
      const naverStock = stocks[i] as NaverAboardStock;
      const symbol = naverStock.symbolCode;
      const stock = await getRepository(Stock).findOne({
        where: { symbol },
        relations: ['stockMeta'],
      });
      if (stock) {
        stock.krName = naverStock.stockName;
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

export default NaverAbroadSyncBot;

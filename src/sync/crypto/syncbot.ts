import { Stock, StockType } from '../../domain/stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { getCryptoList } from './api/getAllCrypto';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';
import { Exchange } from '../../domain/stock/entities/exchange.entity';

//Upbit Api
class CryptoSyncBot {
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
      const symbol = splitMarketName[1];
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
      });
      if (!stock) {
        stock = new Stock();
        stock.type = StockType.CRYPTO;
        stock.krName = crypto.korean_name;
        stock.enName = crypto.english_name;
        stock.symbol = symbol;
        stock.exchange = exchange;
        stock.stockCount = new StockCount();
        stock.stockMeta = new StockMeta();
        await getRepository(Stock).save(stock);
      }
    }
  }
}

export default CryptoSyncBot;

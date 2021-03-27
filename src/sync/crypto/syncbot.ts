import { Stock, StockType } from '../../domain/stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { getCryptoList } from './api/getAllCrypto';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';

class CryptoSyncBot {
  async syncAll() {
    const cryptos = await getCryptoList();
    const krwList = cryptos.filter((v) => {
      return v.market.substring(0, 3) === 'KRW';
    });
    for (let i = 0; i < krwList.length; i++) {
      const crypto = krwList[i];
      const symbol = crypto.market.split('-')[1];
      let stock = await getRepository(Stock).findOne({
        where: { symbol },
      });
      if (!stock) {
        stock = new Stock();
        stock.type = StockType.CRYPTO;
        stock.krName = crypto.korean_name;
        stock.enName = crypto.english_name;
        stock.symbol = symbol;
        stock.stockCount = new StockCount();
        stock.stockMeta = new StockMeta();
        await getRepository(Stock).save(stock);
      }
    }
  }
}

export default CryptoSyncBot;

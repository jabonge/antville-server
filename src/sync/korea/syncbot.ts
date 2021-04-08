import { Exchange } from '../../domain/stock/entities/exchange.entity';
import { StockMeta } from '../../domain/stock/entities/stock-meta.entity';
import { Stock } from '../../domain/stock/entities/stock.entity';
import { getRepository } from 'typeorm';
import { KoreaStockInfoFromCsv, KoreaStockXML } from './korea-stock.interface';
import { parseStringPromise } from 'xml2js';
import { getXml } from './getXml';
import parse from 'csv-parse';
import fs from 'fs';
import cliProgress from 'cli-progress';
import { StockCount } from '../../domain/stock/entities/stock-count.entity';

class KoreaSyncBot {
  async parseKoreaStocks(): Promise<KoreaStockInfoFromCsv[]> {
    const results = [];
    const parser = fs.createReadStream(__dirname + '/kr_stock.csv').pipe(
      parse({
        columns: true,
      }),
    );
    parser.on('readable', function () {
      let record;
      while ((record = parser.read())) {
        results.push(record);
      }
    });
    parser.on('error', (err) => {
      console.log(err);
    });
    return new Promise((resolve) => {
      parser.on('end', () => {
        resolve(results);
      });
    });
  }
  async syncAll() {
    const infos = await this.parseKoreaStocks();
    const bar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic,
    );
    bar.start(infos.length, 0);

    //TODO: i< infos.length;
    for (let i = 0; i < 20; i++) {
      const info = infos[i];
      info.code = info.code.padStart(6, '0');
      let stock = await getRepository(Stock).findOne({
        where: { symbol: info.code },
      });
      if (!stock) {
        stock = new Stock();
        stock.symbol = info.code;
        stock.krName = info.krName;
        stock.enName = info.enName;
        let exchange = await getRepository(Exchange).findOne({
          where: { name: info.exchange },
        });
        if (!exchange) {
          exchange = new Exchange();
          exchange.name = info.exchange;
          exchange.countryCode = 'KR';
          await getRepository(Exchange).save(exchange);
        }
        stock.exchange = exchange;
        stock.stockCount = new StockCount();
        stock.stockMeta = new StockMeta();
        await getRepository(Stock).save(stock);
      }
      bar.increment(1);
    }
    bar.stop();
  }

  async syncStock(stock: Stock) {
    const xml = await getXml(stock.symbol);
    const result: KoreaStockXML = await parseStringPromise(xml);
    const stockInfo = result.stockprice.TBL_StockInfo[0].$;
    if (stockInfo.JongName !== '') {
      // const stockMeta = new StockMeta();
      // stockMeta.stock = stock;
      // stockMeta.latest = +stockInfo.CurJuka.replace(/,/g, '');
      // stockMeta.dayHigh = +stockInfo.HighJuka.replace(/,/g, '');
      // stockMeta.dayLow = +stockInfo.LowJuka.replace(/,/g, '');
      // stockMeta.open = +stockInfo.StartJuka.replace(/,/g, '');
      // stockMeta.previousClose = +stockInfo.PrevJuka.replace(/,/g, '');
      // await getRepository(StockMeta).save(stockMeta);
    } else {
      throw 'Invalid Value';
    }
  }
}

export default KoreaSyncBot;

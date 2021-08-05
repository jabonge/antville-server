import path from 'path';
import * as fs from 'fs/promises';
import { getRepository } from 'typeorm';
import { Stock } from '../../domain/stock/entities/stock.entity';

export async function parseTickers(dir: string) {
  const data = await fs.readFile(path.resolve(dir, `logo_ticker.txt`), 'utf8');
  const tickers = data.split('\n');
  return tickers;
}

export async function updateLogo(dir: string, type: string) {
  const tickers = await parseTickers(dir);
  for (let i = 0; i < tickers.length; i++) {
    let symbol = tickers[i];
    const stock = await getRepository(Stock).findOne({
      select: ['id', 'logo'],
      where: { symbol },
    });
    if (stock && !stock.logo) {
      if (symbol.includes('/KRW')) {
        symbol = symbol.split('/')[0];
      }
      stock.logo = `https://antville-s3.s3.ap-northeast-2.amazonaws.com/logos/${type}/${symbol}.png`;
      await getRepository(Stock).save(stock);
    }
  }
}

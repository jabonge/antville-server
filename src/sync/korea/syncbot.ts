import { downloadStockLogo } from '../utils/download_logo';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getKoreaStockList } from './api/getList';

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));
const exchanges = ['kospi', 'kosdaq'];
const logo_ticker_path = path.resolve(__dirname, 'logo_ticker.txt');
class KoreaSyncBot {
  async downloadAllStockLogo() {
    for (let i = 0; i < exchanges.length; i++) {
      const list = await getKoreaStockList(exchanges[i]);
      const symbols = list.isuLists.map((q) => q.isuSrtCd);
      for (let j = 0; j < symbols.length; j++) {
        await this.downloadUsStockLogo(symbols[j]);
        await sleep(200);
      }
    }
  }

  async downloadUsStockLogo(symbol: string) {
    const imageDir = path.join(
      __dirname,
      '../',
      'logos/korea',
      `${symbol}.png`,
    );
    try {
      await downloadStockLogo(
        `https://money-talk-test.s3.amazonaws.com/stock-logo/${symbol}.png`,
        imageDir,
      );
      fs.appendFile(logo_ticker_path, `${symbol}\n`, 'utf8');
    } catch (err) {
      console.log(`err: ${err} symbol: ${symbol}`);
    }
  }
}

export default KoreaSyncBot;

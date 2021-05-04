import axios from 'axios';

export const aboardClient = axios.create({
  baseURL: 'https://api.stock.naver.com/stock/exchange',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
  },
});

export const domesticClient = axios.create({
  baseURL: 'https://m.stock.naver.com/api/stocks/marketValue',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
  },
});

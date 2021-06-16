export interface UpbitCandleData {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
  unit: number;
}

// {
//   market: "KRW-BTC",
//   candle_date_time_utc: "2021-06-12T11:50:00",
//   candle_date_time_kst: "2021-06-12T20:50:00",
//   opening_price: 41517000,
//   high_price: 41538000,
//   low_price: 41474000,
//   trade_price: 41522000,
//   timestamp: 1623498983632,
//   candle_acc_trade_price: 1841608022.30032,
//   candle_acc_trade_volume: 44.3702836,
//   unit: 10
//   }

export interface UsStockDayFullData {
  symbol: string;
  historical: UsStockCandleData[];
}

export interface UsStockCandleData {
  date: string;
  open: number;
  low: number;
  high: number;
  close: number;
  volume: number;
}

// {
//   date: "2021-06-11 16:00:00", or "2021-06-12"
//   open: 127.26,
//   low: 127.205,
//   high: 127.34,
//   close: 127.34,
//   volume: 47173460
//   }
export class ChartInfo {
  updatedAt?: string;
  lastChartDate?: string;
  length?: number;
}

export class ChartData {
  date: string;
  open: number;
  low: number;
  high: number;
  close: number;
  volume: number;

  constructor(
    date: string,
    open: number,
    low: number,
    high: number,
    close: number,
    volume: number,
  ) {
    this.date = date;
    this.open = open;
    this.low = low;
    this.high = high;
    this.close = close;
    this.volume = volume;
  }

  static upbitCandleToChartData(data: UpbitCandleData) {
    return new ChartData(
      data.candle_date_time_kst,
      data.opening_price,
      data.low_price,
      data.high_price,
      data.trade_price,
      data.candle_acc_trade_volume,
    );
  }

  static usCandleToChartData(data: UsStockCandleData) {
    return new ChartData(
      data.date,
      data.open,
      data.low,
      data.high,
      data.close,
      data.volume,
    );
  }
}

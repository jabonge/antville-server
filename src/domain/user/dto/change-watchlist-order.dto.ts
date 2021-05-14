export class ChangeWatchListOrderDto {
  stockId: number;
  betweenStockIds: number[];
  type: ChangeType;
}

export enum ChangeType {
  LAST = 'LAST',
  FIRST = 'FIRST',
  BETWEEN = 'BETWEEN',
}

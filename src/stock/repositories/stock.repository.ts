import { Stock } from './../entities/stock.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(Stock)
export class StockRepository extends Repository<Stock> {
  async findBySymbol(symbol: string): Promise<Stock> {
    return this.findOne({ where: { symbol }, relations: ['stock_meta'] });
  }
}

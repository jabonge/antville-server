import { Stock } from './../entities/stock.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(Stock)
export class StockRepository extends Repository<Stock> {
  async findBySymbol(symbol: string): Promise<Stock> {
    return this.findOne({ where: { symbol } });
  }

  async searchStock(query: string): Promise<Stock[]> {
    return this.createQueryBuilder()
      .select()
      .where(`MATCH(symbol) AGAINST ('+${query}' IN BOOLEAN MODE)`)
      .orWhere(
        `MATCH(enName,krName) AGAINST ('*${query}* *${query}*' IN BOOLEAN MODE)`,
      )
      .getMany();
  }
}

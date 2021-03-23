import { User } from '../../user/entities/user.entity';
import { Stock } from '../entities/stock.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(Stock)
export class StockRepository extends Repository<Stock> {
  async findBySymbol(symbol: string): Promise<Stock> {
    return this.createQueryBuilder('s')
      .select(['s.id', 's.enName', 's.krName', 's.symbol'])
      .where('s.symbol = :symbol', { symbol })
      .leftJoin('s.stockCount', 'stockCount')
      .addSelect(['stockCount.watchUserCount'])
      .getOne();
  }

  async findBySymbols(symbols: string[]): Promise<Stock[]> {
    return this.createQueryBuilder('stock')
      .where('stock.symbol IN (:...symbols)', { symbols })
      .getMany();
  }

  async searchStock(
    query: string,
    cursor: number,
    limit: number,
  ): Promise<Stock[]> {
    const dbQuery = this.createQueryBuilder()
      .select()
      .orWhere(`symbol LIKE '${query}%'`)
      .orWhere(
        `MATCH(enName,krName) AGAINST ('*${query}* *${query}*' IN BOOLEAN MODE)`,
      )
      .take(limit);
    if (cursor) {
      dbQuery.andWhere('id < :cursor', { cursor });
    }
    return dbQuery.getMany();
  }

  async getWatchList(userId: number): Promise<Stock[]> {
    return this.createQueryBuilder()
      .relation(User, 'stocks')
      .of(userId)
      .loadMany();
  }
}

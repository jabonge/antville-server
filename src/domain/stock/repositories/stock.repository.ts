import { Stock } from '../entities/stock.entity';
import { Brackets, EntityRepository, Repository } from 'typeorm';

@EntityRepository(Stock)
export class StockRepository extends Repository<Stock> {
  async findBySymbol(symbol: string): Promise<Stock> {
    return this.createQueryBuilder('s')
      .select(['s.id', 's.enName', 's.krName', 's.symbol', 's.type'])
      .where('s.symbol = :symbol', { symbol })
      .leftJoin('s.stockCount', 'stockCount')
      .addSelect(['stockCount.watchUserCount'])
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getOne();
  }

  async findByTitle(title: string): Promise<Stock> {
    return this.createQueryBuilder('s')
      .select(['s.id', 's.enName', 's.krName', 's.symbol', 's.type'])
      .where('s.krName = :title', { title })
      .leftJoin('s.stockCount', 'stockCount')
      .addSelect(['stockCount.watchUserCount'])
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getOne();
  }

  async findByTitles(titles: string[]): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .andWhere(
        new Brackets((qb) => {
          qb.where('s.symbol IN (:...titles)', {
            titles,
          }).orWhere('s.krName IN (:...titles)', { titles });
        }),
      )
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getMany();
  }

  async searchStock(
    query: string,
    cursor: number,
    limit: number,
  ): Promise<Stock[]> {
    const dbQuery = this.createQueryBuilder('s')
      .select(['s.id', 's.enName', 's.krName', 's.symbol', 's.type'])
      .andWhere(
        new Brackets((qb) => {
          qb.where(`symbol LIKE '${query}%'`).orWhere(
            `MATCH(enName,krName) AGAINST ('*${query}* *${query}*' IN BOOLEAN MODE)`,
          );
        }),
      )
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .orderBy('s.id', 'ASC')
      .limit(limit);

    if (cursor) {
      dbQuery.andWhere('s.id > :cursor', { cursor });
    }
    return dbQuery.getMany();
  }

  async getWatchList(userId: number): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .select(['s.id', 's.enName', 's.krName', 's.symbol', 's.type'])
      .innerJoin(
        `(SELECT stockId FROM watchlist WHERE userId = ${userId})`,
        'w',
        's.id = w.stockId',
      )
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getMany();
  }

  async getPopularStocks(): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .select(['s.id', 's.enName', 's.krName', 's.symbol', 's.type'])
      .innerJoin('s.stockMeta', 'meta', 'meta.isPopular = true')
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getMany();
  }
}

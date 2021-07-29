import { Stock, StockType } from '../entities/stock.entity';
import { Brackets, EntityRepository, Repository } from 'typeorm';
import { isKoreanLang } from '../../../util/stock';
import { StockMeta } from '../entities/stock-meta.entity';

@EntityRepository(Stock)
export class StockRepository extends Repository<Stock> {
  async findBySymbol(symbol: string): Promise<Stock> {
    return this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.cashTagName',
        's.symbol',
        's.type',
        's.logo',
      ])
      .where('s.symbol = :symbol', { symbol })
      .leftJoin('s.stockCount', 'stockCount')
      .addSelect(['stockCount.watchUserCount'])
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getOne();
  }

  async findByTag(tag: string): Promise<Stock> {
    const isIncludeKoreanLang = isKoreanLang(tag);
    return this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.cashTagName',
        's.symbol',
        's.type',
        's.logo',
      ])
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            isIncludeKoreanLang ? 's.krName = :tag' : 's.symbol = :tag',
            {
              tag,
            },
          ).orWhere('s.cashTagName = :tag', { tag });
        }),
      )
      .leftJoin('s.stockCount', 'stockCount')
      .addSelect(['stockCount.watchUserCount'])
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getOne();
  }

  async findByTags(tags: string[]): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .andWhere(
        new Brackets((qb) => {
          qb.where('s.symbol IN (:...tags)', {
            tags,
          }).orWhere('s.cashTagName IN (:...tags)', { tags });
        }),
      )
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getMany();
  }

  async searchStock(
    query: string,
    page: number,
    limit: number,
  ): Promise<Stock[]> {
    const dbQuery = this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.cashTagName',
        's.symbol',
        's.type',
        's.logo',
      ])
      .andWhere(
        new Brackets((qb) => {
          qb.where(`symbol LIKE '${query}%'`).orWhere(
            `krName LIKE '${query}%'`,
          );
        }),
      )
      .innerJoin('s.stockMeta', 'meta')
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .orderBy('meta.marketCap', 'DESC')
      .offset(page * limit)
      .limit(limit);

    return dbQuery.getMany();
  }

  async getWatchList(userId: number): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.cashTagName',
        's.symbol',
        's.type',
        's.logo',
      ])
      .innerJoin('s.watchUsers', 'w', `w.userId = ${userId}`)
      .orderBy('w.lexorank', 'ASC')
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getMany();
  }

  async getPopularStocks(): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.cashTagName',
        's.symbol',
        's.type',
        's.logo',
      ])
      .innerJoin(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .select(['stockId'])
            .from(StockMeta, 'meta')
            .where(`meta.isPopular IS NOT NULL`)
            .orderBy('meta.isPopular', 'DESC');
          return subQuery;
        },
        'ism',
        'ism.stockId = s.id',
      )
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .getMany();
  }

  async getTopDomesticStockList(): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.symbol',
        's.cashTagName',
        's.type',
        's.logo',
      ])
      .innerJoin('s.stockMeta', 'meta')
      .innerJoin('s.exchange', 'exchange', 'exchange.name = "KOSPI"')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .orderBy('meta.marketCap', 'DESC')
      .limit(20)
      .cache('DOMESTIC', 1000 * 60 * 60 * 24)
      .getMany();
  }

  async getTopUsStockList(): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.symbol',
        's.cashTagName',
        's.type',
        's.logo',
      ])
      .where('s.type IS NULL')
      .innerJoin('s.stockMeta', 'meta')
      .innerJoin('s.exchange', 'exchange', 'exchange.countryCode = "US"')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .orderBy('meta.marketCap', 'DESC')
      .limit(20)
      .cache('ABOARD', 1000 * 60 * 60 * 24)
      .getMany();
  }

  async getTopCryptoStockList(): Promise<Stock[]> {
    return this.createQueryBuilder('s')
      .select([
        's.id',
        's.enName',
        's.krName',
        's.symbol',
        's.cashTagName',
        's.type',
        's.logo',
      ])
      .where(`s.type = "${StockType.CRYPTO}"`)
      .innerJoin('s.stockMeta', 'meta')
      .innerJoin('s.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode'])
      .orderBy('meta.marketCap', 'DESC')
      .limit(20)
      .cache('CRYPTO', 1000 * 60 * 60 * 24)
      .getMany();
  }
}

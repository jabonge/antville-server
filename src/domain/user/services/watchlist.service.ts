import { BadRequestException, Injectable } from '@nestjs/common';

import { In, MoreThan, Repository } from 'typeorm';
import { UserCount } from '../entities/user-count.entity';
import { StockCount } from '../../stock/entities/stock-count.entity';
import CustomError from '../../../util/constant/exception';
import { Watchlist } from '../entities/watchlist.entity';
import { LexoRank } from 'lexorank';
import {
  ChangeType,
  ChangeWatchListOrderDto,
} from '../dtos/change-watchlist-order.dto';
import { genLexoRankList } from '../../../util/lexorank';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private watchlistRepository: Repository<Watchlist>,
  ) {}

  async changeWatchListOrder(
    userId: number,
    { stockId, betweenStockIds, type }: ChangeWatchListOrderDto,
  ) {
    const findWatchList = await this.watchlistRepository.find({
      where: {
        userId,
        stockId: In(betweenStockIds),
      },
    });
    const updateWatchList = await this.watchlistRepository.findOneOrFail({
      where: {
        userId,
        stockId,
      },
    });
    let newLexoRank: LexoRank;
    if (type === ChangeType.FIRST) {
      if (findWatchList.length !== 1) {
        throw new BadRequestException();
      }
      const lexorank = LexoRank.parse(findWatchList[0].lexorank);
      newLexoRank = lexorank.genPrev();
      updateWatchList.lexorank = newLexoRank.toString();
    } else if (type === ChangeType.LAST) {
      if (findWatchList.length !== 1) {
        throw new BadRequestException();
      }
      const lexorank = LexoRank.parse(findWatchList[0].lexorank);
      newLexoRank = lexorank.genNext();
      updateWatchList.lexorank = newLexoRank.toString();
    } else if (type === ChangeType.BETWEEN) {
      if (findWatchList.length !== 2) {
        throw new BadRequestException();
      }
      const firstLexoRank = LexoRank.parse(findWatchList[0].lexorank);
      const secondLexoRank = LexoRank.parse(findWatchList[1].lexorank);
      newLexoRank = firstLexoRank.between(secondLexoRank);
      updateWatchList.lexorank = newLexoRank.toString();
    } else {
      throw new BadRequestException();
    }
    await this.watchlistRepository.save(updateWatchList);
    if (newLexoRank.getDecimal().getScale() > 300) {
      this.lexorankRebalancing(userId);
    }
    return;
  }

  async lexorankRebalancing(userId: number) {
    const findAllWatchList = await this.watchlistRepository.find({
      where: {
        userId,
      },
      order: {
        lexorank: 'ASC',
      },
    });
    const balancedLexoRankList = genLexoRankList(findAllWatchList.length);
    for (let i = 0; i < findAllWatchList.length; i++) {
      findAllWatchList[i].lexorank = balancedLexoRankList[i];
    }
    await this.watchlistRepository.save(findAllWatchList);
  }

  async removeWatchList(userId: number, stockId: number) {
    if (!(await this.isWatching(userId, stockId))) {
      return;
    }
    await this.watchlistRepository.manager.transaction(async (manager) => {
      await manager.delete(Watchlist, {
        userId,
        stockId,
      });
      await manager.decrement(
        UserCount,
        {
          userId,
        },
        'watchStockCount',
        1,
      );
      await manager.decrement(
        StockCount,
        {
          stockId,
        },
        'watchUserCount',
        1,
      );
    });
    return;
  }

  async removeWatchLists(userId: number, stockIds: number[]) {
    await this.watchlistRepository.manager.transaction(async (manager) => {
      const findWatchList = await manager.find(Watchlist, {
        where: {
          userId,
          stockId: In(stockIds),
        },
      });
      const findStockIds = findWatchList.map((e) => e.stockId);
      if (findWatchList.length <= 0) return;
      await manager.delete(Watchlist, {
        userId,
        stockId: In(findStockIds),
      });
      const { watchStockCount } = await manager.findOne(UserCount, { userId });
      if (watchStockCount > stockIds.length) {
        await manager.decrement(
          UserCount,
          {
            userId,
          },
          'watchStockCount',
          findStockIds.length,
        );
      } else {
        await manager.decrement(
          UserCount,
          {
            userId,
          },
          'watchStockCount',
          1,
        );
      }
      await manager.decrement(
        StockCount,
        {
          stockId: In(findStockIds),
          watchUserCount: MoreThan(0),
        },
        'watchUserCount',
        1,
      );
    });
    return;
  }

  async addWatchList(userId: number, stockId: number) {
    if (await this.isWatching(userId, stockId)) {
      return;
    }
    await this.watchlistRepository.manager.transaction(async (manager) => {
      const userCount = await manager.findOne(UserCount, { userId });
      if (userCount.watchStockCount > 19) {
        throw new BadRequestException(CustomError.WATCH_LIST_LIMIT_EXCEED);
      }
      const firstWatchList = await manager.find(Watchlist, {
        where: {
          userId,
        },
        order: {
          lexorank: 'ASC',
        },
        take: 1,
      });

      const watchList = new Watchlist();
      watchList.userId = userId;
      watchList.stockId = stockId;
      if (firstWatchList.length > 0) {
        const first = firstWatchList[0];
        watchList.lexorank = LexoRank.parse(first.lexorank)
          .genPrev()
          .toString();
      }

      await manager.save(Watchlist, watchList);
      await manager.increment(
        UserCount,
        {
          userId,
        },
        'watchStockCount',
        1,
      );
      await manager.increment(
        StockCount,
        {
          stockId,
        },
        'watchUserCount',
        1,
      );
    });
    return;
  }

  async isWatching(myId: number, stockId: number) {
    const count = await this.watchlistRepository.count({
      userId: myId,
      stockId,
    });
    return count > 0;
  }
}

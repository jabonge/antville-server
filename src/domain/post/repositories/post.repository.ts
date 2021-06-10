import { EntityRepository, Repository } from 'typeorm';
import { UserBlock } from '../../user/entities/user-block.entity';
import { Watchlist } from '../../user/entities/watchlist.entity';
import { StockPost } from '../entities/stock-post.entity';
import { Post } from '../entities/post.entity';
import { Stock } from '../../stock/entities/stock.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async findAllPost(cursor: number, limit: number, userId?: number) {
    const query = this.createQueryBuilder('p')
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'DESC')
      .take(limit);
    if (userId) {
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select()
            .from(UserBlock, 'ub')
            .where(`ub.blockerId = ${userId}`)
            .andWhere(`p.authorId = ub.blockedId`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }
  async findAllPostByStockId(
    stockId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    const query = this.createQueryBuilder('p')
      .innerJoin(
        (qb) => {
          const spSubQuery = qb
            .subQuery()
            .select(['postId'])
            .from(StockPost, 'sp')
            .where(`sp.stockId = ${stockId}`)
            .orderBy('sp.postId', 'DESC')
            .limit(limit);
          if (cursor) {
            spSubQuery.andWhere(`postId < ${cursor}`);
          }
          if (userId) {
            spSubQuery.andWhere((qb) => {
              const utbSubQuery = qb
                .subQuery()
                .select()
                .from(UserBlock, 'ub')
                .where(`ub.blockerId = ${userId}`)
                .andWhere(`sp.authorId = ub.blockedId`)
                .getQuery();
              return 'NOT EXISTS ' + utbSubQuery;
            });
          }
          return spSubQuery;
        },
        'isp',
        'isp.postId = p.id',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'DESC');
    if (userId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    return query.getMany();
  }

  async findAllPostByWatchList(userId: number, cursor: number, limit: number) {
    const query = this.createQueryBuilder('p')
      .innerJoin(
        (qb) => {
          const spSubQuery = qb
            .subQuery()
            .select(['postId'])
            .from(StockPost, 'sp')
            .innerJoin(
              (qb) => {
                return qb
                  .subQuery()
                  .select(['stockId'])
                  .from(Watchlist, 'w')
                  .where(`w.userId = ${userId}`);
              },
              'iw',
              'iw.stockId = sp.stockId',
            )
            .orderBy('sp.postId', 'DESC')
            .limit(limit);
          if (cursor) {
            spSubQuery.andWhere(`postId < ${cursor}`);
          }
          if (userId) {
            spSubQuery.andWhere((qb) => {
              const utbSubQuery = qb
                .subQuery()
                .from(UserBlock, 'ub')
                .where(`ub.blockerId = ${userId}`)
                .andWhere(`sp.authorId = ub.blockedId`)
                .getQuery();
              return 'NOT EXISTS ' + utbSubQuery;
            });
          }
          return spSubQuery;
        },
        'isp',
        'isp.postId = p.id',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'DESC');
    return query.getMany();
  }

  async findAllPostByFollowing(userId: number, cursor: number, limit: number) {
    const query = this.createQueryBuilder('p')
      .leftJoin('follow', 'f', 'p.authorId = f.followingId')
      .andWhere(`f.followerId = ${userId}`)
      .innerJoinAndSelect('p.author', 'author')
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'DESC')
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }

  async findOnePost(postId: number, userId?: number) {
    const query = this.createQueryBuilder('p')
      .where('p.id = :id', { id: postId })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .leftJoinAndSelect('p.postStockPrice', 'stockPrice')
      .leftJoinAndSelect('stockPrice.stock', 'stock')
      .leftJoin('stock.exchange', 'exchange')
      .addSelect(['exchange.name', 'exchange.countryCode']);

    if (userId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    return query.getOne();
  }

  async findAllPopularStockPost(cursor: number, limit: number, myId?: number) {
    const query = this.createQueryBuilder('p')
      .innerJoin(
        (qb) => {
          const spSubQuery = qb
            .subQuery()
            .select(['postId'])
            .from(StockPost, 'sp')
            .innerJoin(
              (qb) => {
                return qb
                  .subQuery()
                  .select(['s.id'])
                  .from(Stock, 's')
                  .innerJoin(
                    's.stockMeta',
                    'meta',
                    'meta.isPopular IS NOT NULL',
                  );
              },
              'is',
              'is.s_id = sp.stockId',
            )
            .orderBy('sp.postId', 'DESC')
            .limit(limit);
          if (cursor) {
            spSubQuery.andWhere(`postId < ${cursor}`);
          }
          if (myId) {
            spSubQuery.andWhere((qb) => {
              const utbSubQuery = qb
                .subQuery()
                .select()
                .from(UserBlock, 'ub')
                .where(`ub.blockerId = ${myId}`)
                .andWhere(`sp.authorId = ub.blockedId`)
                .getQuery();
              return 'NOT EXISTS ' + utbSubQuery;
            });
          }
          return spSubQuery;
        },
        'isp',
        'isp.postId = p.id',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'DESC')
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    if (myId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId: myId })
        .addSelect(['u.id']);
    }
    return query.getMany();
  }

  async findAllUserPost(
    cursor: number,
    limit: number,
    userId: number,
    myId?: number,
  ) {
    const query = this.createQueryBuilder('p')
      .andWhere('p.authorId = :id', { id: userId })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'DESC')
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    if (myId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId: myId })
        .addSelect(['u.id']);
    }
    return query.getMany();
  }
  async findAllLikedPost(
    cursor: number,
    limit: number,
    userId: number,
    myId?: number,
  ) {
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const query = this.createQueryBuilder('p')
      .innerJoin(
        `(SELECT postId FROM post_liker pl WHERE userId = ${userId} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'pl',
        'p.id = pl.postId',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'DESC')
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    if (myId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId: myId })
        .addSelect(['u.id']);
    }
    return query.getMany();
  }
}

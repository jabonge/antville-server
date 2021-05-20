import { EntityRepository, Repository } from 'typeorm';
import { UserToBlock } from '../../user/entities/user-block.entity';
import { WatchList } from '../../user/entities/watchlist.entity';
import { PostToStock } from '../entities/post-stock.entity';
import { Post } from '../entities/post.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async findAllPost(cursor: number, limit: number, userId?: number) {
    const query = this.createQueryBuilder('p')
      .where('p.parentId IS NULL')
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
            .from(UserToBlock, 'utb')
            .where(`utb.blockerId = ${userId}`)
            .andWhere(`p.authorId = utb.blockedId`)
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
  async findAllPostById(
    stockId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    const query = this.createQueryBuilder('p')
      .where('p.parentId IS NULL')
      .innerJoin(
        (qb) => {
          const ptsSubQuery = qb
            .subQuery()
            .select(['postId'])
            .from(PostToStock, 'pts')
            .where(`pts.stockId = ${stockId}`)
            .orderBy('pts.postId', 'DESC')
            .limit(limit);
          if (cursor) {
            ptsSubQuery.andWhere(`postId < ${cursor}`);
          }
          if (userId) {
            ptsSubQuery.andWhere((qb) => {
              const utbSubQuery = qb
                .subQuery()
                .select()
                .from(UserToBlock, 'utb')
                .where(`utb.blockerId = ${userId}`)
                .andWhere(`pts.authorId = utb.blockedId`)
                .getQuery();
              return 'NOT EXISTS ' + utbSubQuery;
            });
          }
          return ptsSubQuery;
        },
        'ipts',
        'ipts.postId = p.id',
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
      .where('p.parentId IS NULL')
      .innerJoin(
        (qb) => {
          const ptsSubQuery = qb
            .subQuery()
            .select(['postId'])
            .from(PostToStock, 'pts')
            .innerJoin(
              (qb) => {
                return qb
                  .subQuery()
                  .select(['stockId'])
                  .from(WatchList, 'w')
                  .where(`w.userId = ${userId}`);
              },
              'iw',
              'iw.stockId = pts.stockId',
            )
            .orderBy('pts.postId', 'DESC')
            .limit(limit);
          if (cursor) {
            ptsSubQuery.andWhere(`postId < ${cursor}`);
          }
          if (userId) {
            ptsSubQuery.andWhere((qb) => {
              const utbSubQuery = qb
                .subQuery()
                .from(UserToBlock, 'utb')
                .where(`utb.blockerId = ${userId}`)
                .andWhere(`pts.authorId = utb.blockedId`)
                .getQuery();
              return 'NOT EXISTS ' + utbSubQuery;
            });
          }
          return ptsSubQuery;
        },
        'ipts',
        'ipts.postId = p.id',
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
      .where('p.parentId IS NULL')
      .leftJoin('users_follows', 'uf', 'p.authorId = uf.followingId')
      .andWhere(`uf.followerId = ${userId}`)
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

  async getComments(
    postId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    const query = this.createQueryBuilder('p')
      .where('p.parentId = :id', { id: postId })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .orderBy('p.id', 'ASC')
      .take(limit);
    if (userId) {
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select()
            .from(UserToBlock, 'utb')
            .where(`utb.blockerId = ${userId}`)
            .andWhere(`p.authorId = utb.blockedId`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('p.id > :cursor', { cursor });
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
      .leftJoinAndSelect('p.gifImage', 'gif');
    if (userId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    return query.getOne();
  }

  async findAllUserPost(
    cursor: number,
    limit: number,
    userId: number,
    myId?: number,
  ) {
    const query = this.createQueryBuilder('p')
      .where('p.parentId IS NULL')
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
        `(SELECT postId FROM posts_likers pl WHERE userId = ${userId} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
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

import { EntityRepository, Repository } from 'typeorm';
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
        .innerJoin(
          `(SELECT blockerId,blockingId FROM users_blocks ub WHERE blockerId = ${userId} OR blockingId = ${userId})`,
          'ub',
          'p.authorId != ub.blockerId AND p.authorId != ub.blockingId',
        )
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
    const userWhere = userId
      ? `INNER JOIN
    (SELECT blockerId,blockingId FROM users_blocks WHERE blockerId = ${userId} OR blockingId = ${userId})
    AS ub
    ON pts.authorId != ub.blockerId AND pts.authorId != ub.blockingId`
      : '';
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const query = this.createQueryBuilder('p')
      .where('p.parentId IS NULL')
      .innerJoin(
        `(SELECT postId FROM post_to_stock pts ${userWhere} WHERE stockId = ${stockId} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'ipts',
        'p.id = ipts.postId',
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
    const cursorWhere = cursor ? `WHERE postId < ${cursor}` : '';
    const query = this.createQueryBuilder('p')
      .where('p.parentId IS NULL')
      .innerJoin(
        `(SELECT DISTINCT postId FROM post_to_stock pts INNER JOIN
          (SELECT blockerId,blockingId FROM users_blocks WHERE blockerId = ${userId} OR blockingId = ${userId}) AS ub
          ON pts.authorId != ub.blockerId AND pts.authorId != ub.blockingId
          INNER JOIN (SELECT stockId FROM watchlist w WHERE w.userId = ${userId}) AS iw on iw.stockId = pts.stockId
        ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'ipts',
        'p.id = ipts.postId',
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
        .innerJoin(
          `(SELECT blockerId,blockingId FROM users_blocks ub WHERE blockerId = ${userId} OR blockingId = ${userId})`,
          'ub',
          'p.authorId != ub.blockerId AND p.authorId != ub.blockingId',
        )
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

import { EntityRepository, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async findAllPost(
    blockingUserIds: number[],
    userId: number,
    cursor: number,
    limit: number,
  ) {
    const query = this.createQueryBuilder('p')
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .take(limit);
    if (blockingUserIds.length > 0) {
      query.where('p.authorId NOT IN (:ids)', { ids: [...blockingUserIds] });
    }
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }
  async findAllPostBySymbol(
    stockId: number,
    cursor: number,
    limit: number,
    userId?: number,
    blockingUserIds?: number[],
  ) {
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const authorWhere =
      blockingUserIds && blockingUserIds.length > 0
        ? `AND authorId NOT IN (${blockingUserIds.join(',')})`
        : '';
    const query = this.createQueryBuilder('p')
      .innerJoin(
        `(SELECT postId FROM post_to_stock ps WHERE stockId = ${stockId} ${authorWhere} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'ps',
        'p.id = ps.postId',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .take(limit);
    if (userId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }

    return query.getMany();
  }

  async findAllPostByWatchList(
    blockingUserIds: number[],
    stockIds: number[],
    userId: number,
    cursor: number,
    limit: number,
  ) {
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const authorWhere =
      blockingUserIds.length <= 0
        ? ''
        : `AND authorId NOT IN (${blockingUserIds.join(',')})`;
    const query = this.createQueryBuilder('p')
      .innerJoin(
        `(SELECT DISTINCT postId FROM post_to_stock ps WHERE stockId IN (${stockIds.join(
          ',',
        )}) ${authorWhere} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'ps',
        'p.id = ps.postId',
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
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }

  async findAllPostByFollowing(
    followingIds: number[],
    userId: number,
    cursor: number,
    limit: number,
  ) {
    const query = this.createQueryBuilder('p')
      .innerJoinAndSelect('p.author', 'author', 'author.id IN (:ids)', {
        ids: followingIds.join(','),
      })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
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
      .where('p.postId = :id', { id: postId })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .take(limit);
    if (userId) {
      query
        .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }

  async findAllMyPost(userId: number, cursor: number, limit: number) {
    const query = this.createQueryBuilder('p')
      .where('p.authorId = :id', { id: userId })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .leftJoinAndSelect('p.gifImage', 'gif')
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }
  async findAllLikedPost(userId: number, cursor: number, limit: number) {
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const query = this.createQueryBuilder('p')
      .innerJoin(
        `(SELECT userId FROM posts_likers pl WHERE userId = ${userId} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'pl',
        'p.id = pl.postId',
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
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }
}

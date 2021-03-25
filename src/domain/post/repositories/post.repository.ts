import { EntityRepository, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async findAllPostBySymbol(
    stockId: number,
    userId: number,
    cursor: number,
    limit: number,
  ) {
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const query = this.createQueryBuilder('p')
      .innerJoin(
        `(SELECT postId FROM posts_stocks ps WHERE stockId = ${stockId} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'ps',
        'p.id = ps.postId',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link');
    return query.getMany();
  }

  async findAllPostByWatchList(
    stockIds: number[],
    userId: number,
    cursor: number,
    limit: number,
  ) {
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const query = this.createQueryBuilder('p')
      .innerJoin(
        `(SELECT DISTINCT postId FROM posts_stocks ps WHERE stockId IN (${stockIds.join(
          ',',
        )}) ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'ps',
        'p.id = ps.postId',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link');
    return query.getMany();
  }

  async findAllPostByFollowing(
    followingIds: number[],
    userId: number,
    cursor: number,
    limit: number,
  ) {
    const query = this.createQueryBuilder('p')
      .innerJoin('p.author', 'author', 'author.id IN (:ids)', {
        ids: followingIds.join(','),
      })
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }

  async getComments(
    postId: number,
    userId: number,
    cursor: number,
    limit: number,
  ) {
    const query = this.createQueryBuilder('p')
      .where('p.postId = :id', { id: postId })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
      .take(limit);
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
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link')
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
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoin('p.likers', 'u', 'u.id = :userId', { userId })
      .addSelect(['u.id'])
      .leftJoinAndSelect('p.link', 'link');
    return query.getMany();
  }
}
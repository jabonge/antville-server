import { EntityRepository, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async findAllPostBySymbol(id: number, cursor: number, limit: number) {
    const cursorWhere = cursor ? `AND postId < ${cursor}` : '';
    const query = this.createQueryBuilder('p')
      .innerJoin(
        `(SELECT postId FROM posts_stocks ps WHERE stockId = ${id} ${cursorWhere} ORDER BY postId DESC LIMIT ${limit})`,
        'ps',
        'p.id = ps.postId',
      )
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount', 'postCount.commentCount'])
      .leftJoinAndSelect('p.link', 'link');
    return query.getMany();
  }

  async getComments(postId: number, cursor: number, limit: number) {
    const query = this.createQueryBuilder('p')
      .where('p.postId = :id', { id: postId })
      .leftJoin('p.postImgs', 'postImg')
      .addSelect('postImg.image')
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.nickname', 'author.profileImg'])
      .leftJoin('p.postCount', 'postCount')
      .addSelect(['postCount.likeCount'])
      .leftJoinAndSelect('p.link', 'link')
      .take(limit);
    if (cursor) {
      query.andWhere('p.id < :cursor', { cursor });
    }
    return query.getMany();
  }
}

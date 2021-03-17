import { EntityRepository, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async findAllPostBySymbol(id: number, cursor: number, limit: number) {
    const query = this.createQueryBuilder('post')
      .innerJoin('post.stocks', 'stock', 'stock.id = :id', { id })
      .leftJoinAndSelect('post.postImgs', 'postImg')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.link', 'link')
      .leftJoinAndSelect('post.postCount', 'postCount')
      .orderBy('post.id', 'DESC')
      .where('post.postId IS NULL')
      .take(limit);

    if (cursor) {
      query.andWhere('post.id < :cursor', { cursor });
    }
    return query.getMany();
  }
}

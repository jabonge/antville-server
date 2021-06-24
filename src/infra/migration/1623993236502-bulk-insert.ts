import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { PostCount } from '../../domain/post/entities/post-count.entity';
import { Post } from '../../domain/post/entities/post.entity';
import { StockPost } from '../../domain/post/entities/stock-post.entity';
import { Stock } from '../../domain/stock/entities/stock.entity';

export class bulkInsert1623993236502 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const stocks = await queryRunner.connection.manager.find(Stock, {
      select: ['id', 'symbol'],
      where: {
        id: In(Array.from({ length: 500 }, (_, index) => index + 1)),
      },
    });
    let lastPostId = 50033;
    for (let j = 0; j < 100; j++) {
      const posts = [];
      const stockPosts = [];
      const postCounts = [];
      for (let i = 0; i < 10000; i++) {
        const postId = lastPostId + 1;
        const index = Math.floor(Math.random() * stocks.length);
        const authorId = Math.floor(Math.random() * 5 + 1);
        const { id, symbol } = stocks[index];
        const sp = new StockPost();
        sp.stockId = id;
        sp.authorId = authorId;
        sp.postId = postId;
        stockPosts.push(sp);
        const post = new Post();
        const postCount = new PostCount();
        postCount.postId = postId;
        postCounts.push(postCount);
        post.authorId = authorId;
        post.body = `\$${symbol} 이거 오르나요?`;
        posts.push(post);
        lastPostId++;
      }
      await queryRunner.connection.manager.insert(Post, posts);
      await queryRunner.connection.manager.insert(StockPost, stockPosts);
      await queryRunner.connection.manager.insert(PostCount, postCounts);
      console.log(`${j + 1} 번째 실행중`);
    }
  }

  public async down(_: QueryRunner): Promise<void> {
    return;
  }
}

import { PostImg } from './entities/post-img.entity';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import {
  findAtSignNickname,
  findCacheTags,
  findLinks,
  getOgTags,
} from '../../util/post';
import { User } from '../user/entities/user.entity';
import { PostCount } from './entities/post-count.entity';
import { StockService } from '../stock/stock.service';
import { PostRepository } from './repositories/post.repository';
import { Connection, EntityManager } from 'typeorm';
import { UserService } from '../user/user.service';
import { classToPlain } from 'class-transformer';
import { Stock } from '../stock/entities/stock.entity';
import { PostToStock } from './entities/post-stock.entity';
import { PostReport } from './entities/post-report.entity';
import { NEW_POST, PUB_SUB } from '../../util/constant/redis';
import { NotificationService } from '../notification/notification.service';
import { Link } from '../../common/entities/link.entity';
import { GifImage } from '../../common/entities/gif.entity';
import { PostStockPrice } from './entities/post-price.entity';
import { PubSub } from '../../shared/redis/interfaces';

@Injectable()
export class PostService {
  constructor(
    private connection: Connection,
    @Inject(PUB_SUB)
    private readonly pubsub: PubSub,
    private readonly postRepository: PostRepository,
    private readonly stockService: StockService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}
  async createPost(
    createPostDto: CreatePostDto,
    user: User,
    files: Express.MulterS3.File[],
  ) {
    const postImgs: PostImg[] = [];
    let postLink: Link;
    let gifImage: GifImage;
    if (files.length > 0) {
      files.forEach((f) => {
        const img = new PostImg();
        img.image = f.location;
        postImgs.push(img);
      });
    } else if (!createPostDto.gifId) {
      const link = findLinks(createPostDto.body);
      if (link) {
        const ogResult = await getOgTags(link);
        if (ogResult) {
          postLink = new Link();
          postLink.ogSiteName = ogResult.ogSiteName;
          postLink.ogTitle = ogResult.ogTitle;
          postLink.ogUrl = ogResult.ogUrl;
          postLink.ogDescription = ogResult.ogDescription;
          postLink.ogImage = ogResult.ogImage;
        }
      }
    } else if (createPostDto.gifId) {
      const { gifId, tinyGifUrl, gifUrl, ratio } = createPostDto;
      gifImage = new GifImage();
      gifImage.id = gifId;
      gifImage.gifUrl = gifUrl;
      gifImage.ratio = +ratio;
      gifImage.tinyGifUrl = tinyGifUrl;
    }
    const post = new Post();
    post.sentiment = createPostDto.sentiment;
    post.body = createPostDto.body;
    post.author = user;
    post.postCount = new PostCount();
    post.postImgs = postImgs;
    post.link = postLink;
    post.gifImage = gifImage;

    await this.connection.transaction(async (manager) => {
      const cashTags = findCacheTags(createPostDto.body);
      let stocks: Stock[];
      if (cashTags.length > 0) {
        stocks = await this.stockService.getStocks(cashTags);
        const postToStocks = stocks.map((s) => {
          const ps = new PostToStock();
          ps.stockId = s.id;
          ps.authorId = user.id;
          return ps;
        });
        post.postToStocks = postToStocks;
        if (stocks[0]) {
          const priceInfo = await this.stockService.getPrices([
            stocks[0].symbol,
          ]);
          if (priceInfo[0] && priceInfo[0].latest) {
            const postStockPrice = new PostStockPrice();
            postStockPrice.price = priceInfo[0].latest;
            postStockPrice.stockId = stocks[0].id;
            post.postStockPrice = postStockPrice;
          }
        }
      }

      await manager.save(post);
      delete post.postStockPrice;
      await this.userService.incrementUserCount(manager, user.id, 'postCount');
      await this.createUserTagNotification(
        manager,
        createPostDto.body,
        user,
        post.id,
      );
      if (post.postToStocks?.length > 0) {
        this.pubsub.publisher.publish(
          NEW_POST,
          JSON.stringify(classToPlain(post)),
        );
      }
    });
    return post;
  }

  async findAllPost(cursor: number, limit: number, userId?: number) {
    return this.postRepository.findAllPost(cursor, limit, userId);
  }

  async findOnePost(postId: number, userId?: number) {
    const post = await this.postRepository.findOnePost(postId, userId);
    if (post.postStockPrice) {
      const priceInfo = await this.stockService.getPrices([
        post.postStockPrice.stock.symbol,
      ]);
      if (priceInfo.length === 1 && priceInfo[0].latest) {
        post.postStockPrice.nowPrice = priceInfo[0].latest;
      } else {
        delete post.postStockPrice;
      }
    }
    return post;
  }

  async findAllPostById(
    stockId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    return this.postRepository.findAllPostById(stockId, cursor, limit, userId);
  }

  async findAllPostByFollowing(userId: number, cursor: number, limit: number) {
    return this.postRepository.findAllPostByFollowing(userId, cursor, limit);
  }

  async findAllPostByWatchList(userId: number, cursor: number, limit: number) {
    return this.postRepository.findAllPostByWatchList(userId, cursor, limit);
  }

  async findAllUserPost(
    cursor: number,
    limit: number,
    userId: number,
    myId?: number,
  ) {
    if (myId && userId !== myId) {
      if (await this.userService.isBlockingOrBlockedUser(myId, userId)) {
        return [];
      }
    }
    return this.postRepository.findAllUserPost(cursor, limit, userId, myId);
  }

  async findAllLikedPost(
    cursor: number,
    limit: number,
    userId: number,
    myId?: number,
  ) {
    if (myId && userId !== myId) {
      if (await this.userService.isBlockingOrBlockedUser(myId, userId)) {
        return [];
      }
    }
    return this.postRepository.findAllLikedPost(cursor, limit, userId, myId);
  }

  async deletePost(userId: number, postId: number) {
    return this.postRepository.delete({
      authorId: userId,
      id: postId,
    });
  }

  async likePost(user: User, postId: number) {
    if (await this.isLiked(user.id, postId)) {
      return;
    }
    const post = await this.postRepository.findOne(postId, {
      select: ['authorId'],
    });
    await this.connection.transaction(async (manager) => {
      await Promise.all([
        manager
          .createQueryBuilder(Post, 'p')
          .relation('likers')
          .of(postId)
          .add(user.id),
        manager.increment(
          PostCount,
          {
            postId,
          },
          'likeCount',
          1,
        ),
        this.userService.incrementUserCount(manager, user.id, 'postLikeCount'),
      ]);
      if (post.authorId != user.id) {
        await this.notificationService.likeNotification(
          manager,
          user,
          postId,
          post.authorId,
        );
      }
    });
    return;
  }

  async unLikePost(userId: number, postId: number) {
    if (!(await this.isLiked(userId, postId))) {
      return;
    }
    await this.connection.transaction(async (manager) => {
      await Promise.all([
        manager
          .createQueryBuilder(Post, 'p')
          .relation('likers')
          .of(postId)
          .remove(userId),
        manager.decrement(
          PostCount,
          {
            postId,
          },
          'likeCount',
          1,
        ),
        this.userService.decrementUserCount(manager, userId, 'postLikeCount'),
      ]);
    });
    return;
  }

  async isLiked(myId: number, postId: number) {
    const row = await this.postRepository.manager.query(
      `SELECT COUNT(*) as count FROM posts_likers WHERE userId = ${myId} AND postId = ${postId}`,
    );

    return row[0].count > 0;
  }

  async createReport(userId: number, postId: number) {
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(Post, {
        id: postId,
      });
      const report = new PostReport();
      report.userId = userId;
      report.postId = postId;
      await manager.save(PostReport, report);
    });
  }

  async createUserTagNotification(
    manager: EntityManager,
    body: string,
    user: User,
    postId: number,
  ) {
    let users: User[];
    const userNicknames = findAtSignNickname(body);
    if (userNicknames.length > 0) {
      users = await this.userService.findByNicknames(userNicknames, user);
    }
    if (users) {
      await this.notificationService.createUserTagNotification(
        manager,
        users,
        user,
        postId,
      );
    }
  }
}

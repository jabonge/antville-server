import { PostImg } from './entities/post-img.entity';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import { UserService } from '../user/services/user.service';
import { classToPlain } from 'class-transformer';
import { Stock } from '../stock/entities/stock.entity';
import { StockPost } from './entities/stock-post.entity';
import { PostReport } from './entities/post-report.entity';
import { NEW_POST, PUB_SUB } from '../../util/constant/redis';
import { NotificationService } from '../notification/notification.service';
import { Link } from '../../common/entities/link.entity';
import { GifImage } from '../../common/entities/gif.entity';
import { PostStockPrice } from './entities/post-stock-price.entity';
import { PubSub } from '../../shared/redis/interfaces';
import { UserCount } from '../user/entities/user-count.entity';
import { GifDto } from '../../common/dtos/gif.dto';
import CustomError from '../../util/constant/exception';
import moment from 'moment';

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
    file: Express.MulterS3.File,
  ) {
    const postImgs: PostImg[] = [];
    let postLink: Link;
    let gifImage: GifImage;
    if (file) {
      const img = new PostImg();
      img.image = file.location;
      postImgs.push(img);
    } else if (!createPostDto.gif) {
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
    } else if (createPostDto.gif) {
      const gifDto = JSON.parse(createPostDto.gif) as GifDto;
      gifImage = new GifImage();
      gifImage.id = gifDto.gifId;
      gifImage.gifUrl = gifDto.gifUrl;
      gifImage.ratio = +gifDto.ratio;
      gifImage.tinyGifUrl = gifDto.tinyGifUrl;
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
        const stockPosts = stocks.map((s) => {
          const ps = new StockPost();
          ps.stockId = s.id;
          ps.authorId = user.id;
          ps.symbol = s.symbol;
          return ps;
        });
        post.stockPosts = stockPosts;
        const firstCashTagStock = stocks.find(
          (v) => v.cashTagName === cashTags[0],
        );
        if (firstCashTagStock) {
          const priceInfo = await this.stockService.getPrices([
            firstCashTagStock.symbol,
          ]);
          if (priceInfo[0] && priceInfo[0].latest) {
            const postStockPrice = new PostStockPrice();
            postStockPrice.price = priceInfo[0].latest;
            postStockPrice.stockId = firstCashTagStock.id;
            post.postStockPrice = postStockPrice;
          }
        }
      }

      await manager.save(post);
      delete post.postStockPrice;
      await manager.increment(UserCount, { userId: user.id }, 'postCount', 1);
      await this.createUserTagNotification(
        manager,
        createPostDto.body,
        user,
        post.id,
      );
      if (post.stockPosts?.length > 0) {
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
    if (!post) {
      throw new BadRequestException();
    }
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

  async findAllPostByStockId(
    stockId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    return this.postRepository.findAllPostByStockId(
      stockId,
      cursor,
      limit,
      userId,
    );
  }

  async findAllPostByFollowing(userId: number, cursor: number, limit: number) {
    return this.postRepository.findAllPostByFollowing(userId, cursor, limit);
  }

  async findAllPostByRecommendUser(
    userId: number,
    cursor: number,
    limit: number,
  ) {
    return this.postRepository.findAllPostByRecommendUser(
      userId,
      cursor,
      limit,
    );
  }

  async findAllPopularStockPost(cursor: number, limit: number, myId?: number) {
    return this.postRepository.findAllPopularStockPost(cursor, limit, myId);
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
    const post = await this.postRepository.findOne(postId, {
      select: ['id', 'createdAt'],
      where: {
        authorId: userId,
      },
    });
    if (!post) {
      throw new BadRequestException(CustomError.INVALID_POST);
    }
    if (moment().diff(new Date(post.createdAt), 'm') > 5) {
      throw new BadRequestException(CustomError.DELETE_TIMEOUT);
    }
    await this.connection.transaction(async (manager) => {
      await manager.delete(Post, postId);
      await manager.decrement(
        UserCount,
        {
          userId,
        },
        'postCount',
        1,
      );
    });
    return;
  }

  async likePost(user: User, postId: number) {
    if (await this.isLiked(user.id, postId)) {
      return;
    }
    const post = await this.postRepository.findOne(postId, {
      select: ['authorId'],
    });
    if (!post) {
      throw new BadRequestException(CustomError.INVALID_POST);
    }
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
        manager.increment(UserCount, { userId: user.id }, 'postLikeCount', 1),
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
    const post = await this.postRepository.findOne(postId, {
      select: ['id'],
    });
    if (!post) {
      throw new BadRequestException(CustomError.INVALID_POST);
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
        manager.decrement(UserCount, { userId }, 'postLikeCount', 1),
      ]);
    });
    return;
  }

  async isLiked(myId: number, postId: number) {
    const row = await this.postRepository.manager.query(
      `SELECT COUNT(*) as count FROM post_liker WHERE userId = ${myId} AND postId = ${postId}`,
    );

    return row[0].count > 0;
  }

  async createReport(userId: number, postId: number) {
    const post = await this.connection.manager.findOne(Post, {
      id: postId,
    });
    if (!post) {
      throw new BadRequestException(CustomError.INVALID_POST);
    }
    const isExistReport = await this.connection.manager.findOne(PostReport, {
      where: {
        userId,
        postId,
      },
    });
    if (isExistReport) {
      throw new BadRequestException(CustomError.ALREADY_REPORT);
    }
    const report = new PostReport();
    report.userId = userId;
    report.postId = postId;
    await this.connection.manager.save(PostReport, report);
  }

  async createUserTagNotification(
    manager: EntityManager,
    body: string,
    user: User,
    postId: number,
  ) {
    let users: User[];
    const findNicknames = findAtSignNickname(body);
    const removeSelf = findNicknames.filter((v) => v !== user.nickname);
    if (removeSelf.length > 0) {
      users = await this.userService.findByNicknames(removeSelf, user.id);
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

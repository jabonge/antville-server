import { PostLink } from './entities/link.entity';
import { PostImg } from './entities/post-img.entity';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { findCacheTags, findLinks, getOgTags } from '../../util/post';
import { User } from '../user/entities/user.entity';
import { PostCount } from './entities/post-count.entity';
import { StockService } from '../stock/stock.service';
import { PostRepository } from './repositories/post.repository';
import { Connection, IsNull } from 'typeorm';
import { UserService } from '../user/user.service';
import { PubSub } from '../../common/interfaces/pub_sub.interface';
import { classToPlain } from 'class-transformer';
import { GifImage } from './entities/gif.entity';
import { Stock } from '../stock/entities/stock.entity';
import { PostToStock } from './entities/post-stock.entity';
import { Report } from './entities/report.entity';
import { NEW_POST, PUB_SUB } from '../../util/constant/pubsub';

@Injectable()
export class PostService {
  constructor(
    private connection: Connection,
    @Inject(PUB_SUB)
    private readonly pubsub: PubSub,
    private readonly postRepository: PostRepository,
    private readonly stockService: StockService,
    private readonly userService: UserService,
  ) {}
  async createPost(
    createPostDto: CreatePostDto,
    user: User,
    files: Express.MulterS3.File[],
  ) {
    let postImgs: PostImg[];
    let postLink: PostLink;
    let gifImage: GifImage;
    if (files.length > 0) {
      postImgs = [];
      files.forEach((f) => {
        const img = new PostImg();
        img.image = f.location;
        postImgs.push(img);
      });
    } else if (!createPostDto.gifId) {
      const link = findLinks(createPostDto.body);
      if (link) {
        const ogResult = await getOgTags(link);
        if (ogResult.ogImage) {
          postLink = new PostLink();
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
      gifImage.ratio = ratio;
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
      if (createPostDto.postId) {
        const parent = await manager.findOneOrFail(Post, createPostDto.postId, {
          select: ['id'],
          where: {
            postId: IsNull(),
          },
        });
        post.postId = parent.id;
        await manager.increment(
          PostCount,
          {
            postId: parent.id,
          },
          'commentCount',
          1,
        );
      } else {
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
        }
      }
      await manager.save(post);
      await this.userService.incrementUserCount(manager, user.id, 'postCount');
      if (post.postToStocks?.length > 0) {
        this.pubsub.publisher.publish(
          NEW_POST,
          JSON.stringify(classToPlain(post)),
        );
      }
    });
    return;
  }

  async getComments(
    postId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    return this.postRepository.getComments(postId, cursor, limit, userId);
  }

  async findAllPost(userId: number, cursor: number, limit: number) {
    const blockingUserIds = await this.userService.findBlockingAndBlockerIds(
      userId,
    );
    return this.postRepository.findAllPost(
      blockingUserIds,
      userId,
      cursor,
      limit,
    );
  }

  async findOnePost(postId: number, userId?: number) {
    return this.postRepository.findOnePost(postId, userId);
  }

  async findAllPostBySymbol(
    stockId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    let blockingUserIds;
    if (userId) {
      blockingUserIds = await this.userService.findBlockingAndBlockerIds(
        userId,
      );
    }
    return this.postRepository.findAllPostBySymbol(
      stockId,
      cursor,
      limit,
      userId,
      blockingUserIds,
    );
  }

  async findAllPostByFollowing(userId: number, cursor: number, limit: number) {
    const userIds = await this.userService.findFollwingIds(userId);
    return this.postRepository.findAllPostByFollowing(
      userIds,
      userId,
      cursor,
      limit,
    );
  }

  async findAllPostByWatchList(userId: number, cursor: number, limit: number) {
    const stocks = await this.stockService.getWatchList(userId);
    if (stocks.length <= 0) {
      return [];
    }
    const stockIds = stocks.map((s) => s.id);
    const blockingUserIds = await this.userService.findBlockingAndBlockerIds(
      userId,
    );
    return this.postRepository.findAllPostByWatchList(
      blockingUserIds,
      stockIds,
      userId,
      cursor,
      limit,
    );
  }

  async findAllUserPost(userId: number, cursor: number, limit: number) {
    return this.postRepository.findAllUserPost(userId, cursor, limit);
  }

  async findAllLikedPost(userId: number, cursor: number, limit: number) {
    return this.postRepository.findAllLikedPost(userId, cursor, limit);
  }

  async deletePost(userId: number, postId: number) {
    return this.postRepository.delete({
      authorId: userId,
      postId: postId,
    });
  }

  async likePost(userId: number, postId: number) {
    await this.connection.transaction(async (manager) => {
      await manager
        .createQueryBuilder(Post, 'p')
        .relation('likers')
        .of(postId)
        .add(userId);
      await manager.increment(
        PostCount,
        {
          postId,
        },
        'likeCount',
        1,
      );
      await this.userService.incrementUserCount(
        manager,
        userId,
        'postLikeCount',
      );
    });
    return;
  }

  async unLikePost(userId: number, postId: number) {
    await this.connection.transaction(async (manager) => {
      await manager
        .createQueryBuilder(Post, 'p')
        .relation('likers')
        .of(postId)
        .remove(userId);
      await manager.decrement(
        PostCount,
        {
          postId,
        },
        'likeCount',
        1,
      );
      await this.userService.decrementUserCount(
        manager,
        userId,
        'postLikeCount',
      );
    });
    return;
  }

  async createReport(userId: number, postId: number) {
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(Post, {
        id: postId,
      });
      const report = new Report();
      report.userId = userId;
      report.postId = postId;
      await manager.save(Report, report);
    });
  }
}

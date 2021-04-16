import { PostLink } from './entities/link.entity';
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
import { Connection, IsNull } from 'typeorm';
import { UserService } from '../user/user.service';
import { PubSub } from '../../common/interfaces/pub_sub.interface';
import { classToPlain } from 'class-transformer';
import { GifImage } from './entities/gif.entity';
import { Stock } from '../stock/entities/stock.entity';
import { PostToStock } from './entities/post-stock.entity';
import { Report } from './entities/report.entity';
import { NEW_POST, PUB_SUB } from '../../util/constant/pubsub';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto/create-notification.dto';
import { NotificationType } from '../notification/entities/notification.entity';

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
    let postLink: PostLink;
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
    const userNicknames = findAtSignNickname(createPostDto.body);
    let users: User[];
    if (userNicknames.length > 0) {
      users = await this.userService.findByNicknames(userNicknames, user);
    }
    await this.connection.transaction(async (manager) => {
      if (createPostDto.postId) {
        const parent = await manager.findOneOrFail(Post, createPostDto.postId, {
          select: ['id', 'authorId'],
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
        if (!users && parent.authorId != user.id) {
          await this.notificationService.createCommentNotification(
            manager,
            user,
            parent.authorId,
            post.postId,
          );
        }
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
      if (users) {
        await this.notificationService.createUserTagNotification(
          manager,
          users,
          user,
          post.id,
          post.postId,
        );
      }
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
    const blockUserIds = await this.userService.findBlockingAndBlockerIds(
      userId,
    );
    return this.postRepository.getComments(
      blockUserIds,
      postId,
      cursor,
      limit,
      userId,
    );
  }

  async findAllPost(userId: number, cursor: number, limit: number) {
    const blockUserIds = await this.userService.findBlockingAndBlockerIds(
      userId,
    );
    return this.postRepository.findAllPost(blockUserIds, userId, cursor, limit);
  }

  async findOnePost(postId: number, userId?: number) {
    return this.postRepository.findOnePost(postId, userId);
  }

  async findAllPostById(
    stockId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    let blockUserIds;
    if (userId) {
      blockUserIds = await this.userService.findBlockingAndBlockerIds(userId);
    }
    return this.postRepository.findAllPostById(
      stockId,
      cursor,
      limit,
      userId,
      blockUserIds,
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
    const blockUserIds = await this.userService.findBlockingAndBlockerIds(
      userId,
    );
    return this.postRepository.findAllPostByWatchList(
      blockUserIds,
      stockIds,
      userId,
      cursor,
      limit,
    );
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
      postId: postId,
    });
  }

  async likePost(user: User, postId: number) {
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
        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.paramId = postId;
        createNotificationDto.type = NotificationType.LIKE;
        createNotificationDto.user = user;
        createNotificationDto.viewerId = post.authorId;
        await this.notificationService.create(manager, createNotificationDto);
      }
    });
    return;
  }

  async unLikePost(userId: number, postId: number) {
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

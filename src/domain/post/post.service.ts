import { PostLink } from './entities/link.entity';
import { PostImg } from './entities/post-img.entity';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { findCacheTags, findLinks, getOgTags } from '../../util';
import { User } from '../user/entities/user.entity';
import { PostCount } from './entities/post-count.entity';
import { StockService } from '../stock/stock.service';
import { PostRepository } from './repositories/post.repository';
import { Connection, IsNull } from 'typeorm';
import { UserService } from '../user/user.service';
import { NEW_POST, PUB_SUB } from '../../common/constants/pubsub.constants';
import { PubSub } from '../../common/interfaces/pub_sub.interface';
import { classToPlain } from 'class-transformer';

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
    if (files.length > 0) {
      postImgs = [];
      files.forEach((f) => {
        const img = new PostImg();
        img.image = f.location;
        postImgs.push(img);
      });
    } else if (!createPostDto.gifUrl) {
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
    }
    const post = new Post();
    post.sentiment = createPostDto.sentiment;
    post.gifUrl = createPostDto.gifUrl;
    post.body = createPostDto.body;
    post.author = user;
    post.postCount = new PostCount();
    post.postImgs = postImgs;
    post.link = postLink;
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
        let stocks;
        if (cashTags.length > 0) {
          stocks = await this.stockService.getStocks(cashTags);
        }
        post.stocks = stocks;
      }
      await manager.save(post);
      await this.userService.incrementUserCount(manager, user.id, 'postCount');
      if (post.stocks.length > 0) {
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
    userId: number,
    cursor: number,
    limit: number,
  ) {
    return this.postRepository.getComments(postId, userId, cursor, limit);
  }

  async findAllPostBySymbol(
    stockId: number,
    userId: number,
    cursor: number,
    limit: number,
  ) {
    return this.postRepository.findAllPostBySymbol(
      stockId,
      userId,
      cursor,
      limit,
    );
  }

  async findAllPostByFollowing(userId: number, cursor: number, limit: number) {
    const users = await this.userService.findFollwingIds(userId);
    const userIds = users.map((u) => u.id);
    if (userIds.length <= 0) {
      return [];
    }
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
    return this.postRepository.findAllPostByWatchList(
      stockIds,
      userId,
      cursor,
      limit,
    );
  }

  async findAllMyPost(userId: number, cursor: number, limit: number) {
    return this.postRepository.findAllMyPost(userId, cursor, limit);
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
}

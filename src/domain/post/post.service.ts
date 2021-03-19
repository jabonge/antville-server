import { PostLink } from './entities/link.entity';
import { PostImg } from './entities/post-img.entity';
import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { findCacheTags, findLinks, getOgTags } from '../../util';
import { User } from '../user/entities/user.entity';
import { PostCount } from './entities/post-count.entity';
import { StockService } from '../stock/stock.service';
import { PostRepository } from './repositories/post.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostCount)
    private postCountRepository: Repository<PostCount>,
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
    if (createPostDto.postId) {
      const parent = await this.postRepository.findOneOrFail(
        createPostDto.postId,
        {
          select: ['id'],
          where: {
            postId: IsNull(),
          },
        },
      );
      post.postId = parent.id;
      await this.postCountRepository.increment(
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
    await this.postRepository.save(post);
    await this.userService.incrementUserCount(user.id, 'postCount');
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

  //likePost User:postLikeCount, Post:likeCount
  //unlikePost User:postLikeCount, Post:likeCount
  async likePost(userId: number, postId: number) {
    return;
  }

  async unLikePost(userId: number, postId: number) {
    return;
  }
}

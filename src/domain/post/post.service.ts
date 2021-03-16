import { PostLink } from './entities/link.entity';
import { PostImg } from './entities/post-img.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { findCacheTags, findLinks, getOgTags } from '../../util';
import { User } from '../user/entities/user.entity';
import { PostCount } from './entities/post-count.entity';
import { StockService } from '../stock/stock.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly stockService: StockService,
  ) {}
  async createPost(
    createPostDto: CreatePostDto,
    user: User,
    files: Express.MulterS3.File[],
  ) {
    let postImgs: PostImg[];
    let postLink: PostLink;
    if (files) {
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
          postLink.ogImage = ogResult.ogImage;
          postLink.ogTitle = ogResult.ogTitle;
          postLink.ogUrl = ogResult.ogUrl;
          postLink.ogDescription = ogResult.ogDescription;
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
    const cashTags = findCacheTags(createPostDto.body);
    let stocks;
    if (cashTags.length > 0) {
      stocks = await this.stockService.getStocks(cashTags);
    }
    post.stocks = stocks;
    await this.postRepository.save(post);
    return;
  }
}

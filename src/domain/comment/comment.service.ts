import { Post } from './../post/entities/post.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, MoreThan, Repository } from 'typeorm';
import { GifImage } from '../../common/entities/gif.entity';
import { Link } from '../../common/entities/link.entity';
import { findAtSignNickname, findLinks, getOgTags } from '../../util/post';
import { NotificationService } from '../notification/notification.service';
import { PostCount } from '../post/entities/post-count.entity';
import { UserBlock } from '../user/entities/user-block.entity';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/services/user.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentCount } from './entities/comment-count.entity';
import { CommentImg } from './entities/comment-img.entity';
import { CommentReport } from './entities/comment-report.entity';
import { Comment } from './entities/comment.entity';
import { GifDto } from '../../common/dtos/gif.dto';
import CustomError from '../../util/constant/exception';
import moment from 'moment';

@Injectable()
export class CommentService {
  constructor(
    private connection: Connection,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async createComment(
    createCommentDto: CreateCommentDto,
    user: User,
    file: Express.MulterS3.File,
  ) {
    const commentImgs: CommentImg[] = [];
    let link: Link;
    let gifImage: GifImage;
    if (file) {
      const img = new CommentImg();
      img.image = file.location;
      commentImgs.push(img);
    } else if (!createCommentDto.gif) {
      const firstlink = findLinks(createCommentDto.body);
      if (firstlink) {
        const ogResult = await getOgTags(firstlink);
        if (ogResult) {
          link = new Link();
          link.ogSiteName = ogResult.ogSiteName;
          link.ogTitle = ogResult.ogTitle;
          link.ogUrl = ogResult.ogUrl;
          link.ogDescription = ogResult.ogDescription;
          link.ogImage = ogResult.ogImage;
        }
      }
    } else if (createCommentDto.gif) {
      const gifDto = JSON.parse(createCommentDto.gif) as GifDto;
      gifImage = new GifImage();
      gifImage.id = gifDto.gifId;
      gifImage.gifUrl = gifDto.gifUrl;
      gifImage.ratio = +gifDto.ratio;
      gifImage.tinyGifUrl = gifDto.tinyGifUrl;
    }
    const comment = new Comment();
    comment.body = createCommentDto.body;
    comment.author = user;
    comment.commentCount = new CommentCount();
    comment.commentImgs = commentImgs;
    comment.link = link;
    comment.gifImage = gifImage;

    await this.connection.transaction(async (manager) => {
      const post = await manager.findOneOrFail(Post, createCommentDto.postId, {
        select: ['id', 'authorId'],
      });
      comment.postId = post.id;
      await manager.increment(
        PostCount,
        {
          postId: post.id,
        },
        'commentCount',
        1,
      );
      if (createCommentDto.parentCommentId) {
        const parentComment = await manager.findOneOrFail(
          Comment,
          createCommentDto.parentCommentId,
          {
            select: ['id', 'authorId'],
          },
        );
        await manager.increment(
          CommentCount,
          {
            commentId: parentComment.id,
          },
          'nextCommentCount',
          1,
        );
        comment.parentCommentId = parentComment.id;
      }
      await manager.save(comment);
      await this.createUserTagNotification(
        manager,
        createCommentDto.body,
        user,
        post.id,
      );
    });
    return comment;
  }

  async getFirstComments(
    postId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    const query = this.commentRepository
      .createQueryBuilder('c')
      .where('c.postId = :id', { id: postId })
      .andWhere('c.parentCommentId IS NULL')
      .innerJoin('c.author', 'author')
      .addSelect([
        'author.id',
        'author.nickname',
        'author.wadizBadge',
        'author.influencerBadge',
        'author.profileImg',
      ])
      .leftJoin('c.commentImgs', 'commentImg')
      .addSelect('commentImg.image')
      .leftJoin('c.commentCount', 'commentCount')
      .addSelect(['commentCount.likeCount', 'commentCount.nextCommentCount'])
      .leftJoinAndSelect('c.link', 'link')
      .leftJoinAndSelect('c.gifImage', 'gif')
      .orderBy('c.id', 'ASC')
      .take(limit);
    if (userId) {
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select()
            .from(UserBlock, 'ub')
            .where(`ub.blockerId = ${userId}`)
            .andWhere(`c.authorId = ub.blockedId`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .leftJoin('c.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('c.id > :cursor', { cursor });
    }
    return query.getMany();
  }

  async getSecondComments(
    parentCommentId: number,
    cursor: number,
    limit: number,
    userId?: number,
  ) {
    const query = this.commentRepository
      .createQueryBuilder('c')
      .where('c.parentCommentId = :id', { id: parentCommentId })
      .innerJoin('c.author', 'author')
      .addSelect([
        'author.id',
        'author.nickname',
        'author.wadizBadge',
        'author.influencerBadge',
        'author.profileImg',
      ])
      .leftJoin('c.commentImgs', 'commentImg')
      .addSelect('commentImg.image')
      .leftJoin('c.commentCount', 'commentCount')
      .addSelect(['commentCount.likeCount'])
      .leftJoinAndSelect('c.link', 'link')
      .leftJoinAndSelect('c.gifImage', 'gif')
      .orderBy('c.id', 'ASC')
      .take(limit);
    if (userId) {
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select()
            .from(UserBlock, 'ub')
            .where(`ub.blockerId = ${userId}`)
            .andWhere(`c.authorId = ub.blockedId`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .leftJoin('c.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('c.id > :cursor', { cursor });
    }
    return query.getMany();
  }

  async findOneComment(commentId: number, userId?: number) {
    const query = this.commentRepository
      .createQueryBuilder('c')
      .where('c.id = :id', { id: commentId })
      .innerJoin('c.author', 'author')
      .addSelect([
        'author.id',
        'author.nickname',
        'author.wadizBadge',
        'author.influencerBadge',
        'author.profileImg',
      ])
      .leftJoin('c.commentImgs', 'commentImg')
      .addSelect('commentImg.image')
      .leftJoin('c.commentCount', 'commentCount')
      .addSelect(['commentCount.likeCount', 'commentCount.nextCommentCount'])
      .leftJoinAndSelect('c.link', 'link')
      .leftJoinAndSelect('c.gifImage', 'gif');
    if (userId) {
      query
        .leftJoin('c.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    const comment = await query.getOne();
    if (!comment) {
      throw new BadRequestException();
    }
    return comment;
  }

  async deleteComment(userId: number, commentId: number) {
    const comment = await this.commentRepository
      .createQueryBuilder('c')
      .where('c.id = :id AND c.authorId = :userId', { id: commentId, userId })
      .addSelect(['c.id', 'c.createdAt', 'c.parentCommentId', 'c.postId'])
      .innerJoin('c.commentCount', 'commentCount')
      .addSelect(['commentCount.likeCount', 'commentCount.nextCommentCount'])
      .getOne();
    if (!comment) {
      throw new BadRequestException(CustomError.INVALID_POST);
    }
    if (moment().diff(new Date(comment.createdAt), 'm') > 5) {
      throw new BadRequestException(CustomError.DELETE_TIMEOUT);
    }
    await this.connection.transaction(async (manager) => {
      await manager.delete(Comment, commentId);
      if (comment.parentCommentId) {
        await manager.decrement(
          CommentCount,
          {
            commentId: comment.parentCommentId,
          },
          'nextCommentCount',
          1,
        );
        await manager.decrement(
          PostCount,
          {
            postId: comment.postId,
          },
          'commentCount',
          1,
        );
      } else {
        await manager.decrement(
          PostCount,
          {
            postId: comment.postId,
            commentCount: MoreThan(comment.commentCount.nextCommentCount),
          },
          'commentCount',
          1 + comment.commentCount.nextCommentCount,
        );
      }
    });
    return;
  }

  async likeComment(user: User, commentId: number) {
    if (await this.isLiked(user.id, commentId)) {
      return;
    }
    const comment = await this.commentRepository.findOne(commentId, {
      select: ['authorId', 'postId'],
    });
    if (!comment) {
      throw new BadRequestException(CustomError.INVALID_POST);
    }
    await this.connection.transaction(async (manager) => {
      await Promise.all([
        manager
          .createQueryBuilder(Comment, 'c')
          .relation('likers')
          .of(commentId)
          .add(user.id),
        manager.increment(
          CommentCount,
          {
            id: commentId,
          },
          'likeCount',
          1,
        ),
      ]);
      if (comment.authorId != user.id) {
        await this.notificationService.likeNotification(
          manager,
          user,
          comment.postId,
          comment.authorId,
        );
      }
    });
    return;
  }

  async unLikeComment(userId: number, commentId: number) {
    if (!(await this.isLiked(userId, commentId))) {
      return;
    }
    const comment = await this.commentRepository.findOne(commentId, {
      select: ['id'],
    });
    if (!comment) {
      throw new BadRequestException(CustomError.INVALID_POST);
    }
    await this.connection.transaction(async (manager) => {
      await Promise.all([
        manager
          .createQueryBuilder(Comment, 'c')
          .relation('likers')
          .of(commentId)
          .remove(userId),
        manager.decrement(
          CommentCount,
          {
            commentId,
          },
          'likeCount',
          1,
        ),
      ]);
    });
    return;
  }

  async isLiked(myId: number, commentId: number) {
    const row = await this.connection.manager.query(
      `SELECT COUNT(*) as count FROM comment_liker WHERE userId = ${myId} AND commentId = ${commentId}`,
    );

    return row[0].count > 0;
  }

  async createReport(userId: number, commentId: number) {
    const comment = await this.connection.manager.findOne(Comment, {
      id: commentId,
    });
    if (!comment) {
      throw new BadRequestException(CustomError.INVALID_POST);
    }
    const isExistReport = await this.connection.manager.findOne(CommentReport, {
      where: {
        userId,
        commentId,
      },
    });
    if (isExistReport) {
      throw new BadRequestException(CustomError.ALREADY_REPORT);
    }
    const report = new CommentReport();
    report.userId = userId;
    report.commentId = commentId;
    await this.connection.manager.save(CommentReport, report);
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

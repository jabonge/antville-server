import { Post } from './../post/entities/post.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository } from 'typeorm';
import { GifImage } from '../../common/entities/gif.entity';
import { Link } from '../../common/entities/link.entity';
import { findAtSignNickname, findLinks, getOgTags } from '../../util/post';
import { NotificationService } from '../notification/notification.service';
import { PostCount } from '../post/entities/post-count.entity';
import { UserToBlock } from '../user/entities/user-block.entity';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentCount } from './entities/comment-count.entity';
import { CommentImg } from './entities/comment-img.entity';
import { CommentReport } from './entities/comment-report.entity';
import { Comment } from './entities/comment.entity';

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
    files: Express.MulterS3.File[],
  ) {
    const commentImgs: CommentImg[] = [];
    let link: Link;
    let gifImage: GifImage;
    if (files.length > 0) {
      files.forEach((f) => {
        const img = new CommentImg();
        img.image = f.location;
        commentImgs.push(img);
      });
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
      const gifDto = JSON.parse(createCommentDto.gif);
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
      .leftJoin('c.commentImgs', 'commentImg')
      .addSelect('commentImg.image')
      .leftJoinAndSelect('c.author', 'author')
      .leftJoin('c.commentCount', 'commentCount')
      .addSelect(['commentCount.likeCount', 'commentCount.nextCommentCount'])
      .leftJoinAndSelect('c.link', 'link')
      .leftJoinAndSelect('c.gifImage', 'gif')
      .orderBy('c.id', 'DESC')
      .take(limit);
    if (userId) {
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select()
            .from(UserToBlock, 'utb')
            .where(`utb.blockerId = ${userId}`)
            .andWhere(`c.authorId = utb.blockedId`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .leftJoin('c.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('c.id < :cursor', { cursor });
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
      .leftJoin('c.commentImgs', 'commentImg')
      .addSelect('commentImg.image')
      .leftJoinAndSelect('c.author', 'author')
      .leftJoin('c.commentCount', 'commentCount')
      .addSelect(['commentCount.likeCount'])
      .leftJoinAndSelect('c.link', 'link')
      .leftJoinAndSelect('c.gifImage', 'gif')
      .orderBy('c.id', 'DESC')
      .take(limit);
    if (userId) {
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select()
            .from(UserToBlock, 'utb')
            .where(`utb.blockerId = ${userId}`)
            .andWhere(`c.authorId = utb.blockedId`)
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .leftJoin('c.likers', 'u', 'u.id = :userId', { userId })
        .addSelect(['u.id']);
    }
    if (cursor) {
      query.andWhere('c.id < :cursor', { cursor });
    }
    return query.getMany();
  }

  async deleteComment(userId: number, commentId: number) {
    return this.commentRepository.delete({
      authorId: userId,
      id: commentId,
    });
  }

  async likeComment(user: User, commentId: number) {
    if (await this.isLiked(user.id, commentId)) {
      return;
    }
    const comment = await this.commentRepository.findOne(commentId, {
      select: ['authorId', 'postId'],
    });
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
      `SELECT COUNT(*) as count FROM comments_likers WHERE userId = ${myId} AND commentId = ${commentId}`,
    );

    return row[0].count > 0;
  }

  async createReport(userId: number, commentId: number) {
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(Comment, {
        id: commentId,
      });
      const report = new CommentReport();
      report.userId = userId;
      report.commentId = commentId;
      await manager.save(CommentReport, report);
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

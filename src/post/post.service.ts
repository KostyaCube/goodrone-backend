import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Post as PostModel, Prisma, Comment } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { API_MESSAGES } from 'src/constants/api-messages';
import { FileService } from 'src/file/file.service';
import { GetPostsQueryDto } from './dto/post.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  constructor(private prisma: PrismaService, private readonly fileService: FileService) { }

  async checkAndCreateKeyword({ body }: { body: string; }): Promise<number> {
    try {
      const existed = await this.prisma.keyword.findFirst({
        where: { body: { contains: body, }, }
      });
      if (existed) return existed.id;
      else {
        const newWord = await this.prisma.keyword.create({ data: { body: `${body.charAt(0).toUpperCase()}${body.slice(1)}` } });
        return newWord.id;
      }
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_CREATING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async createPost(data: Prisma.PostCreateInput): Promise<PostModel> {
    try {
      return this.prisma.post.create({ data });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_CREATING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async getPosts(params: GetPostsQueryDto & { orderBy?: Prisma.PostOrderByWithRelationInput; }): Promise<PostModel[]> {
    let { skip, orderBy } = params;
    let where: any = { lang: params.lang };

    if (params.userID) {
      where = { author: { id: params.userID } };
    }
    try {
      return this.prisma.post.findMany({
        skip, orderBy, where,
        include: { comments: true, files: true, keywords: true, author: { select: { id: true, activity: true, firstname: true, lastname: true, email: true } } }
      });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  async getSavedByUserPosts({ userID }: { userID: string; }): Promise<PostModel[]> {
    try {
      return this.prisma.post.findMany({
        where: { savedBy: { some: { id: +userID } } },
        include: { author: true, keywords: true, files: true, comments: true },
      });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    }
  }

  async getPost(where: Prisma.PostWhereUniqueInput): Promise<PostModel> {
    try {
      const result = await this.prisma.post.findUnique({
        where,
        include: {
          comments: {
            include: {
              author: { select: { firstname: true, lastname: true, activity: true } },
              replyOn: {
                include: {
                  author: { select: { firstname: true, lastname: true, activity: true } },
                },
              },
            },
          },
          files: true,
          keywords: true,
          author: { select: { firstname: true, lastname: true, activity: true } },
        },
      });
      if (!result) {
        throw new HttpException(`Post ${where.id} not found`, HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw err instanceof HttpException
        ? err
        : new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePost(params: { where: Prisma.PostWhereUniqueInput; data: Prisma.PostUpdateInput; }): Promise<PostModel> {
    const { data, where } = params;
    await this.getPost(where);
    try {
      return this.prisma.post.update({ where, data });
    } catch (err) {
      this.logger.error(API_MESSAGES.EDITING_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<PostModel> {
    try {
      const post = await this.getPost(where);
      const arrOfLinks = this.fileService.extractImageSrcs(post.body);

      if (post['files'].length > 0) {
        await this.fileService.deleteFileById({ id: Number(post['files'][0].id) });
      }

      arrOfLinks.forEach(async (item) => {
        await this.fileService.deleteFileByLink(item);
      });

      return this.prisma.post.delete({ where });
    } catch (err) {
      this.logger.error(API_MESSAGES.DELETE_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async createComment(data: Prisma.CommentCreateInput): Promise<Comment> {
    try {
      return this.prisma.comment.create({ data });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_CREATING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async getUserComments(userId: number): Promise<Comment[]> {
    try {
      return this.prisma.comment.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: {
              firstname: true,
              lastname: true,
              activity: true, id: true
            }
          },
          replyOn: {
            select: {
              author: {
                select: {
                  firstname: true,
                  lastname: true,
                  activity: true
                }
              }
            }
          }
        }
      });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  async updateComment(params: { where: Prisma.CommentWhereUniqueInput; data: Prisma.CommentUpdateInput; }): Promise<Comment> {
    const { data, where } = params;
    try {
      return this.prisma.comment.update({ where, data });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  async deleteComment(where: Prisma.CommentWhereUniqueInput): Promise<Comment> {
    try {
      return this.prisma.comment.delete({ where });
    } catch (err) {
      this.logger.error(API_MESSAGES.DELETE_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.DELETE_FAIL, HttpStatus.NOT_FOUND);
    };
  }

  async getUsersPostsLength(params: { id: number; }): Promise<number> {
    try {
      return this.prisma.post.count({ where: { author: { id: params.id } } });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  async addArticleToFavorites(userID: number, id: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userID },
        data: { savedPosts: { connect: { id } }, },
      });
    } catch (err) {
      this.logger.error(API_MESSAGES.EDITING_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async removeArticleFromFavorites(userID: number, id: number) {
    try {
      await this.prisma.user.update({
        where: { id: userID },
        data: { savedPosts: { disconnect: { id }, }, },
      });
    }
    catch (err) {
      this.logger.error(API_MESSAGES.EDITING_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }
}
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { Post as PostModel, Prisma, Comment } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { FileService } from 'src/file/file.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService, private readonly fileService: FileService) { }

  async checkAndCreateKeyword({ body }: { body: string; }): Promise<number> {
    try {
      const existed = await this.prisma.keyword.findFirst({
        where: {
          body: {
            contains: body,
          },
        }
      });
      if (existed) return existed.id;
      else {
        const newWord = await this.prisma.keyword.create({ data: { body: `${body.charAt(0).toUpperCase()}${body.slice(1)}` } });
        return newWord.id;
      }
    } catch (err) {
      console.error(err.message);
    };
  }

  async createPost(data: Prisma.PostCreateInput): Promise<PostModel> {
    try {
      return this.prisma.post.create({ data });
    } catch (err) {
      console.error(err.message);
    };
  }

  async getPosts(params: {
    lang: string;
    skip?: number;
    orderBy?: Prisma.PostOrderByWithRelationInput;
    userID?: string;
  }): Promise<PostModel[]> {
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
      console.error(err.message);
    };
  }

  async getSavedByUserPosts(params: { userID: string; }): Promise<PostModel[]> {
    try {
      return await this.prisma.post.findMany({
        where: {
          savedBy: {
            some: {
              id: +params.userID,
            },
          },
        },
        include: {
          author: true,
          keywords: true,
          files: true,
          comments: true
        }
      });
    } catch (err) {
      console.error(err.message);
    };
  }

  async getPost(
    questionWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<PostModel | null> {
    const result = await this.prisma.post.findUnique({
      where: questionWhereUniqueInput,
      include: {
        comments: {
          include: {
            author: {
              select: {
                firstname: true,
                lastname: true,
                activity: true
              }
            },
            replyOn: {
              include: {
                author: {
                  select: {
                    firstname: true,
                    lastname: true,
                    activity: true
                  }
                },
              }
            }
          }
        },
        files: true,
        keywords: true,
        author: {
          select: {
            firstname: true,
            lastname: true,
            activity: true
          }
        }
      }
    });
    if (!result) throw new HttpException(`Post ${questionWhereUniqueInput.id} not exists `, HttpStatus.NOT_FOUND);
    return result;
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<PostModel> {
    const { data, where } = params;
    const post = await this.getPost(params.where);
    if (!post) throw new HttpException(`Post ${where.id} not exists `, HttpStatus.NOT_FOUND);
    try {
      return this.prisma.post.update({ where, data });
    } catch (err) {
      console.error(err.message);
    };
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
      console.error(err.message);
    };
  }

  async createComment(data: Prisma.CommentCreateInput): Promise<Comment> {
    try {
      return this.prisma.comment.create({ data });
    } catch (err) {
      console.error(err.message);
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
      console.error(err.message);
    };
  }

  async updateComment(params: {
    where: Prisma.CommentWhereUniqueInput;
    data: Prisma.CommentUpdateInput;
  }): Promise<Comment> {
    const { data, where } = params;
    try {
      return this.prisma.comment.update({ where, data });
    } catch (err) {
      console.error(err.message);
      throw new HttpException(`Comment ${where.id} not exists `, HttpStatus.NOT_FOUND);
    };
  }

  async deleteComment(where: Prisma.CommentWhereUniqueInput): Promise<Comment> {
    try {
      return this.prisma.comment.delete({ where });
    } catch (err) {
      console.error(err.message);
    };
  }

  async getUsersPostsLength(params: { id: number; }): Promise<number> {
    try {
      return this.prisma.post.count({ where: { author: { id: params.id } } });
    } catch (err) {
      console.error(err.message);
    };
  }

  async addArticleToFavorites(userID: string, id: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: +userID },
        data: {
          savedPosts: {
            connect: { id },
          },
        },
      });
    } catch (err) {
      console.error(err.message);
    };
  }

  async removeArticleFromFavorites(userID: string, id: number) {
    await this.prisma.user.update({
      where: { id: +userID },
      data: {
        savedPosts: {
          disconnect: { id },
        },
      },
    });
  }
}

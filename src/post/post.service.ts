import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Post as PostModel, Prisma, Comment } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) { }

  async createPost(data: Prisma.PostCreateInput): Promise<PostModel> {
    try {
      return this.prisma.post.create({ data });
    } catch (err) {
      console.error(err.message);
      throw err;
    };
  }

  async getPosts(params: {
    lang: string;
    skip?: number;
    orderBy?: Prisma.PostOrderByWithRelationInput;
    userUUID?: string;
  }): Promise<PostModel[]> {
    let { skip, orderBy } = params;
    let where: any = { lang: params.lang };

    if (params.userUUID) {
      where = { author: { uuid: params.userUUID } };
    }
    try {
      return this.prisma.post.findMany({
        skip, orderBy, where,
        include: {
          comments: true, files: true, keywords: true, author: {
            select: {
              id: true, firstname: true,
              lastname: true,
            }
          }
        }
      });
    } catch (err) {
      console.error(err.message);
      return [];
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
              }
            },
            replyOn: {
              include: {
                author: {
                  select: {
                    firstname: true,
                    lastname: true,
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
      throw err;
    };
  }
}
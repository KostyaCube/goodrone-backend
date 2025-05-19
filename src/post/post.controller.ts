import {
  Controller, Get, Post, Put, Delete, Body, Query,
  UseInterceptors, UploadedFiles, Param, HttpException, HttpStatus
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Post as PostModel, Prisma, Comment } from '@prisma/client';
import { FileService } from 'src/file/file.service';
import { PostService } from './post.service';
import { editFileName, imageFileFilter } from 'src/file/file.utils';

@Controller()
export class PostController {
  constructor(private readonly postService: PostService,
    private readonly fileService: FileService) { }

  @UseInterceptors(FilesInterceptor('images', 1, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @Post('articles')
  async createPost(@Body() data: { title: string; body: string; email: string; keywords: string[]; lang: string; },
    @UploadedFiles() images?: Array<File>): Promise<PostModel> {

    const { lang, title, body, email, keywords } = data;

    const promises = keywords && keywords.length ? keywords.map(async (word: string) => {
      return await this.postService.checkAndCreateKeyword({ body: word });
    }) : [];

    const keywordsArr = await Promise.all(promises);
    const createPostData = {
      title, body, lang,
      author: { connect: { email } },
      files: { connect: [] },
      keywords: {
        connect: keywordsArr.map(id => ({ id })) || []
      },
    };

    try {
      if (images) {
        const promises = images.map(async (image) => {
          const photoUrl = `${process.env.HOST}/file/${image.name}`;
          const savedImage = await this.fileService.createFile({
            link: photoUrl,
          });
          return savedImage.id;
        });
        const imagesArray = await Promise.all(promises);
        createPostData.files = { connect: imagesArray.map(id => ({ id })) };
      }
      return await this.postService.createPost(createPostData);
    } catch (err) {
      console.error(err.message);
    };
  }


  @Get('articles')
  async getPostsByQuery(@Query() params: {
    lang: string;
    skip?: number;
    order?: Prisma.PostOrderByWithRelationInput;
    userID?: string;
    saved?: string;
  }): Promise<PostModel[]> {
    const order = params.order as string;
    const orderBy = order ? { [order]: 'desc' } as Prisma.PostOrderByWithRelationInput : { rating: 'desc' } as Prisma.PostOrderByWithRelationInput;
    try {
      if (params.saved && params.userID) {
        return await this.postService.getSavedByUserPosts({ userID: params.userID });
      };
      if (params.skip)
        return this.postService.getPosts({
          ...params, skip: Number(params.skip), orderBy,
        });
      return this.postService.getPosts({
        ...params, orderBy, userID: params.userID
      });
    } catch (err) {
      console.error(err.message);
    };
  }

  @Get('articles/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    try {
      if (!Number.isNaN(Number(id))) return this.postService.getPost({ id: Number(id) });
      else
        throw new HttpException(`Wrong id: ${id}`, HttpStatus.BAD_REQUEST);
    } catch (err) {
      console.error(err.message);
    };
  };

  @Get('articles/make-viewed/:id')
  async makeViewed(@Param('id') id: string): Promise<{}> {
    try {
      if (!Number.isNaN(Number(id))) {
        await this.postService.updatePost({
          where: { id: Number(id) },
          data: {
            views: {
              increment: 1
            }
          }
        });
        return {};
      }
      else
        throw new HttpException(`Wrong id: ${id}`, HttpStatus.BAD_REQUEST);
    } catch (err) {
      console.error(err.message);
    };
  }

  @Delete('articles/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    try {
      return this.postService.deletePost({ id: Number(id) });
    } catch (err) {
      console.error(err.message);
    };
  }

  @Post('comments')
  async addComment(@Body() data: { body: string; email: string; postId: string; replyOn?: string; }): Promise<Comment> {
    const { body, email, postId, replyOn } = data;
    const commentData = {
      body,
      author: { connect: { email } },
      post: { connect: { id: Number(postId) } },
      files: { connect: [] },
      replyOn: undefined
    };
    if (replyOn)
      commentData.replyOn = { connect: { id: Number(replyOn) } };
    try {
      return this.postService.createComment(commentData);
    } catch (err) {
      console.error(err.message);
    };
  }

  @Get('comments/:userId')
  async getComments(@Param('userId') userId: string): Promise<Comment[]> {
    try {
      return this.postService.getUserComments(Number(userId));
    } catch (err) {
      console.error(err.message);
    };
  }

  @Put('comments/:id')
  async editComment(
    @Param('id') id: string,
    @Body() commentData: { body: string; }): Promise<Comment> {
    try {
      return await this.postService.updateComment({
        where: { id: Number(id) },
        data: {
          body: commentData.body
        }
      });
    } catch (err) {
      console.error(err.message);
    };
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string): Promise<Comment> {
    try {
      return this.postService.deleteComment({ id: Number(id) });
    } catch (err) {
      console.error(err.message);
    };
  }
}
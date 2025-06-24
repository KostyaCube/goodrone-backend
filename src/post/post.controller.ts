import {
  Controller, Get, Post, Put, Delete, Body, Query,
  UseInterceptors, UploadedFiles, Param, HttpException, HttpStatus,
  UseGuards, Req,
  UnauthorizedException,
  ParseIntPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Post as PostModel, Prisma, Comment, Keyword } from '@prisma/client';
import { editFileName, imageFileFilter } from 'src/file/file.utils';
import { FileService } from 'src/file/file.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthRequest } from 'src/auth/jwt.strategy';
import { diskStorage } from 'multer';
import { PostService } from './post.service';
import { API_MESSAGES } from 'src/constants/api-messages';
import { CreatePostDto, GetPostsQueryDto, UpdatePostDto } from './dto/post.dto';
import { AddCommentDto, EditCommentDto } from './dto/comment.dto';

@Controller()
export class PostController {
  constructor(private readonly postService: PostService,
    private readonly fileService: FileService) { }

  @Get('keywords')
  async getAllKeywords(@Query() params: { take?: string; }): Promise<Keyword[]> {
    try {
      return this.postService.getKeywords(+params.take);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  @UseInterceptors(FilesInterceptor('images', 1, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @UseGuards(AuthGuard('jwt'))
  @Post('articles')
  async createPost(@Body() data: CreatePostDto, @Req() req: AuthRequest, @UploadedFiles() images?: Array<Express.Multer.File>): Promise<PostModel> {

    const { lang, title, body, keywords } = data;

    if (!req.user) {
      throw new UnauthorizedException(API_MESSAGES.UNAUTHORIZED_RES);
    }

    try {
      const promises = keywords && keywords.length ? keywords.map(async (word: string) => {
        return await this.postService.checkAndCreateKeyword({ body: word });
      }) : [];

      const keywordsArr = await Promise.all(promises);

      const createPostData = {
        title, body, lang,
        author: { connect: { id: req.user.id } },
        files: { connect: [] },
        keywords: {
          connect: keywordsArr.map(id => ({ id }))
        },
      };

      if (images) {
        const promises = images.map(async (image) => {
          const photoUrl = `${process.env.HOST}:${process.env.PORT}/file/${image.filename}`;
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
      throw new HttpException(err.message || API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @UseInterceptors(FilesInterceptor('images', 1, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @UseGuards(AuthGuard('jwt'))
  @Put('articles/:id')
  async editArticle(@Param('id', ParseIntPipe) id: number, @Body() articleData: UpdatePostDto, @UploadedFiles() images?: Array<Express.Multer.File>): Promise<PostModel> {
    let { keywords } = articleData;

    try {
      await this.postService.updatePost({
        where: { id },
        data: {
          keywords: {
            set: []
          }
        }
      });
    } catch (err) {
      console.error(err.message);
    };


    const promises = keywords && keywords.length ? keywords.map(async (word: string) => {
      return await this.postService.checkAndCreateKeyword({ body: word });
    }) : [];

    const keywordsArr = await Promise.all(promises);

    const updateQuestionData = {
      ...articleData,
      keywords: {
        connect: keywordsArr.map(id => ({ id }))
      },
      files: undefined
    };

    if (images) {
      const promises = images.map(async (image) => {
        const photoUrl = `${process.env.HOST}:${process.env.PORT}/file/${image.filename}`;
        try {
          const savedImage = await this.fileService.createFile({
            created_at: new Date(),
            link: photoUrl,
          });
          return savedImage.id;
        } catch (err) {
          console.error(err.message);
        };
      });

      const imagesArray = await Promise.all(promises);
      updateQuestionData.files = { connect: imagesArray.map(id => ({ id })) };

      try {
        return this.postService.updatePost({
          where: { id },
          data: updateQuestionData
        });
      } catch (err) {
        throw new HttpException(err.message || API_MESSAGES.UNKNOWN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
      };
    }
  }

  @Get('articles')
  async getPostsByQuery(@Query() params: GetPostsQueryDto): Promise<PostModel[]> {
    const orderBy: Prisma.PostOrderByWithRelationInput = params.order
      ? { [params.order]: 'desc' }
      : { rating: 'desc' };

    try {
      if (params.saved && params.userID) {
        return await this.postService.getSavedByUserPosts({ userID: params.userID });
      }

      return this.postService.getPosts({
        ...params,
        skip: params.skip ? Number(params.skip) : undefined,
        orderBy,
        userID: params.userID
      });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('articles/:id')
  async getPostById(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    if (Number.isNaN(id)) {
      throw new HttpException(`${API_MESSAGES.INVALID_ID}: ${id}`, HttpStatus.BAD_REQUEST);
    }
    try {
      return this.postService.getPost({ id });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('articles/make-viewed/:id')
  async makeViewed(@Param('id', ParseIntPipe) id: number): Promise<{}> {
    if (Number.isNaN(id)) {
      throw new HttpException(`${API_MESSAGES.INVALID_ID}: ${id}`, HttpStatus.BAD_REQUEST);
    }
    try {
      await this.postService.updatePost({
        where: { id },
        data: { views: { increment: 1 } }
      });
      return {};
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.UNKNOWN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('articles/:id')
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.postService.deletePost({ id });
      return;
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('articles-length/:id')
  async getUserPostsLength(@Param('id', ParseIntPipe) id: number): Promise<number> {
    try {
      return await this.postService.getUsersPostsLength({ id });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    };
  };

  @Post('articles/favorites/:userID/:id')
  async addToFavorite(@Param('id', ParseIntPipe) id: number, @Param('userID', ParseIntPipe) userID: number): Promise<void> {
    try {
      return this.postService.addArticleToFavorites(userID, id);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @Delete('articles/favorites/:userID/:id')
  async removeFromFavorite(@Param('id', ParseIntPipe) id: number, @Param('userID', ParseIntPipe) userID: number): Promise<void> {
    try {
      return this.postService.removeArticleFromFavorites(userID, id);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

    @UseGuards(AuthGuard('jwt'))
  @Post('comments')
  async addComment(@Body() data: AddCommentDto, @Req() req: AuthRequest,): Promise<Comment> {
    if (!req.user) {
      throw new UnauthorizedException(API_MESSAGES.UNAUTHORIZED_RES);
    }
    const { body, postId, replyOn } = data;
    const commentData = {
      body,
      author: { connect: { id: req.user.id } },
      post: { connect: { id: +postId } },
      files: { connect: [] },
      replyOn: undefined
    };

    if (replyOn)
      commentData.replyOn = { connect: { id: +replyOn } };
    try {
      return this.postService.createComment(commentData);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @Get('comments/:userId')
  async getComments(@Param('userId', ParseIntPipe) userId: number): Promise<Comment[]> {
    try {
      return await this.postService.getUserComments(userId);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('comments/:id')
  async editComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() commentData: EditCommentDto): Promise<Comment> {
    try {
      return await this.postService.updateComment({
        where: { id },
        data: { body: commentData.body }
      });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number): Promise<Comment> {
    try {
      return await this.postService.deleteComment({ id });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
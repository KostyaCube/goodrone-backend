import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put, Query, UploadedFiles, UseInterceptors, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, GetQuestionsQueryDto } from './dto/question.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Question as QuestionModel, Prisma, Keyword } from '@prisma/client';
import { diskStorage } from 'multer';
import { FileService } from 'src/file/file.service';
import { editFileName, imageFileFilter } from 'src/file/file.utils';
import { PostService } from 'src/post/post.service';
import { AuthRequest } from 'src/auth/jwt.strategy';
import { API_MESSAGES } from 'src/constants/api-messages';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePostDto } from 'src/post/dto/post.dto';


@Controller()
export class QuestionController {
  constructor(private readonly questionService: QuestionService,
    private readonly postService: PostService,
    private readonly fileService: FileService) { }

  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @UseGuards(AuthGuard('jwt'))
  @Post('questions')
  async createQuestion(@Body() data: CreateQuestionDto, @Req() req: AuthRequest,
    @UploadedFiles() images?: Array<Express.Multer.File>): Promise<QuestionModel> {

    if (!req.user) {
      throw new UnauthorizedException(API_MESSAGES.UNAUTHORIZED_RES);
    }

    const { title, body, keywords } = data;
    const currentDate = new Date();
    const scope = this;

    const promises = keywords.map(async (word: string) => {
      return await scope.postService.checkAndCreateKeyword({ body: word });
    });

    const keywordsArr = await Promise.all(promises);

    const createQuestionData = {
      title, body,
      author: { connect: { id: req.user.id } },
      keywords: {
        connect: keywordsArr.map(id => ({ id })) || []
      },
      files: { connect: [] },
      created_at: currentDate,
      updated_at: currentDate
    };

    try {
      if (images) {
        const promises = images.map(async (image) => {
          const photoUrl = `${process.env.HOST}/file/${image.filename}`;
          const savedImage = await this.fileService.createFile({
            created_at: currentDate,
            link: photoUrl,
          });
          return savedImage.id;
        });
        const imagesArray = await Promise.all(promises);
        createQuestionData.files = { connect: imagesArray.map(id => ({ id })) };
      }
      return this.questionService.createQuestion(createQuestionData);
    } catch (err) {
      console.error(err.message);
    };
  }

  @Get('questions')
  async getQuestionsByQuery(@Query() params: GetQuestionsQueryDto): Promise<QuestionModel[]> {
    const order = params.order as string;
    const orderBy = order ? { [order]: 'desc' } as Prisma.QuestionOrderByWithRelationInput : { rating: 'desc' } as Prisma.QuestionOrderByWithRelationInput;

    let keywords = [];
    if (typeof params.keywords === 'string') {
      keywords = [Number(params.keywords)];
    } else if (Array.isArray(params.keywords)) {
      keywords = params.keywords.map(item => Number(item));
    }

    let where: {
      keywords?: {
        some: {
          OR: { id: number; }[];
        };
      };

    } = {
      keywords: {
        some: {
          OR: [],
        },
      },
    };

    if (keywords.length) {
      where.keywords.some.OR = keywords.map(keywordId => ({
        id: keywordId,
      }));
    } else {
      where.keywords = undefined;
    }

    try {
      if (params.skip)
        return this.questionService.getQuestions({
          ...params, skip: Number(params.skip), orderBy, where, userID: params.userID
        });
      return this.questionService.getQuestions({
        ...params, orderBy, where, userID: params.userID
      });
    } catch (err) {
      console.error(err.message);
    };

  }

  @Get('questions-search/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<QuestionModel[]> {
    try {
      return this.questionService.getQuestions({
        where: {
          OR: [
            {
              title: { contains: searchString, mode: 'insensitive' },
            },
            {
              body: { contains: searchString, mode: 'insensitive' },
            },
          ],
        },
      });
    } catch (err) {
      console.error(err.message);
    };
  }

  @Get('questions/:id')
  async getQuestionById(@Param('id') id: string): Promise<QuestionModel> {
    try {
      if (!Number.isNaN(Number(id))) return this.questionService.getQuestion({ id: Number(id) });
      else
        throw new HttpException(`Wrong id: ${id}`, HttpStatus.BAD_REQUEST);
    } catch (err) {
      console.error(err.message);
    };
  };

  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @UseGuards(AuthGuard('jwt'))
  @Put('questions/:id')
  async editQuestion(
    @Param('id') id: string,
    @Body() data: UpdatePostDto,
    @UploadedFiles() images?: Array<Express.Multer.File>
  ): Promise<QuestionModel> {
    let { keywords } = data;

    // const question = await this.questionService.getQuestion({ id: Number(id) });
    // if (question['files'].length) {
    //     const oldImages = question['files'].map(async file => {
    //         await this.fileService.deleteFileById({ id: file.id });
    //     });
    //     await Promise.all(oldImages);
    // };
    try {
      await this.questionService.updateQuestion({
        where: { id: Number(id) },
        data: {
          keywords: {
            set: []
          }
        }
      });
    } catch (err) {
      console.error(err.message);
    };
    const scope = this;

    const promises = keywords.map(async (word: string) => {
      return await scope.postService.checkAndCreateKeyword({ body: word });
    });

    const keywordsArr = await Promise.all(promises);

    const updateQuestionData = {
      ...data,
      updated_at: new Date(),
      keywords: {
        connect: keywordsArr.map(id => ({ id })) || []
      },
      files: undefined,
    };

    if (images) {
      const promises = images.map(async (image) => {
        const photoUrl = `${process.env.HOST}/file/${image.filename}`;
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
    }

    try {
      return this.questionService.updateQuestion({
        where: { id: Number(id) },
        data: updateQuestionData,
      });
    } catch (err) {
      console.error(err.message);
    };
  }

  @Get('questions/make-viewed/:id')
  async makeViewed(@Param('id') id: string): Promise<void> {
    try {
      if (!Number.isNaN(Number(id)))
        await this.questionService.updateQuestion({
          where: { id: Number(id) },
          data: {
            views: {
              increment: 1
            }
          }
        });
      else
        throw new HttpException(`Wrong id: ${id}`, HttpStatus.BAD_REQUEST);
    } catch (err) {
      console.error(err.message);
    };
  }

  @Delete('questions/:id')
  async deletePost(@Param('id') id: string): Promise<QuestionModel> {
    try {
      return this.questionService.deleteQuestion({ id: Number(id) });
    } catch (err) {
      console.error(err.message);
    };
  }

  @Get('keywords')
  async getAllKeywords(@Query() params: {
    take?: string;
  }): Promise<Keyword[]> {
    try {
      return this.postService.getKeywords(Number(params.take));
    } catch (err) {
      console.error(err.message);
    };
  }

  @Post('questions/favorites/:userID/:id')
  async addQuestionToFavorite(@Param('id') id: string, @Param('userID') userID: string): Promise<void> {
    try {
      return this.questionService.addQuestionToFavorites(userID, Number(id));
    } catch (err) {
      console.error(err.message);
    };
  }

  @Delete('questions/favorites/:userID/:id')
  async removeFromFavorites(@Param('id') id: string, @Param('userID') userID: string): Promise<void> {
    try {
      return this.questionService.removeFromFavorites(userID, Number(id));
    } catch (err) {
      console.error(err.message);
    };
  }

  @Get('questions-length')
  async getAllQuestionsCount(): Promise<number> {
    try {
      return this.questionService.getQuestionsCount();
    } catch (err) {
      console.error(err.message);
    };
  }
}
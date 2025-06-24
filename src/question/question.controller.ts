import {
  Controller, Get, Post, Body, Param, Delete, HttpException,
  HttpStatus, Put, Query, UploadedFiles, UseInterceptors, Req, UnauthorizedException, UseGuards, ParseIntPipe
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, GetQuestionsQueryDto } from './dto/question.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Question as QuestionModel, Prisma, Keyword, Answer as AnswerModel } from '@prisma/client';
import { diskStorage } from 'multer';
import { FileService } from 'src/file/file.service';
import { editFileName, imageFileFilter } from 'src/file/file.utils';
import { PostService } from 'src/post/post.service';
import { AuthRequest } from 'src/auth/jwt.strategy';
import { API_MESSAGES } from 'src/constants/api-messages';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePostDto } from 'src/post/dto/post.dto';
import { UserService } from 'src/user/user.service';
import { CreateAnswerDto } from './dto/answer.dto';

@Controller()
export class QuestionController {
  constructor(private readonly questionService: QuestionService,
    private readonly postService: PostService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
  ) { }

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
        connect: keywordsArr.map(id => ({ id }))
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
      throw new HttpException(err.message || API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    };

  }

  @Get('questions-search/:searchString')
  async getFilteredPosts(@Param('searchString') searchString: string,): Promise<QuestionModel[]> {
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
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @Get('questions/:id')
  async getQuestionById(@Param('id', ParseIntPipe) id: number,): Promise<QuestionModel> {
    try {
      if (!Number.isNaN(id)) return this.questionService.getQuestion({ id: Number(id) });
      else
        throw new HttpException(`Wrong id: ${id}`, HttpStatus.BAD_REQUEST);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  };

  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @UseGuards(AuthGuard('jwt'))
  @Put('questions/:id')
  async editQuestion(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePostDto, @UploadedFiles() images?: Array<Express.Multer.File>): Promise<QuestionModel> {
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
        where: { id },
        data: {
          keywords: {
            set: []
          }
        }
      });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.UNKNOWN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
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
        where: { id },
        data: updateQuestionData,
      });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.UNKNOWN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @Get('questions/make-viewed/:id')
  async makeViewed(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      if (!Number.isNaN(id))
        await this.questionService.updateQuestion({
          where: { id },
          data: {
            views: {
              increment: 1
            }
          }
        });
      else
        throw new HttpException(`Wrong id: ${id}`, HttpStatus.BAD_REQUEST);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.UNKNOWN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('questions/:id')
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<QuestionModel> {
    try {
      return this.questionService.deleteQuestion({ id });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.DELETE_FAIL, HttpStatus.BAD_REQUEST);
    };
  }

  @Get('keywords')
  async getAllKeywords(@Query() params: { take?: string; }): Promise<Keyword[]> {
    try {
      return this.postService.getKeywords(Number(params.take));
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.BAD_REQUEST);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('questions/favorites/:id')
  async addQuestionToFavorite(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedException(API_MESSAGES.UNAUTHORIZED_RES);
    }
    try {
      return this.questionService.addQuestionToFavorites(req.user.id, id);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.UNKNOWN_ERROR, HttpStatus.BAD_REQUEST);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('questions/favorites/:id')
  async removeFromFavorites(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedException(API_MESSAGES.UNAUTHORIZED_RES);
    }
    try {
      return this.questionService.removeFromFavorites(req.user.id, id);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.UNKNOWN_ERROR, HttpStatus.BAD_REQUEST);
    };
  }

  @Get('questions-length')
  async getAllQuestionsCount(): Promise<number> {
    try {
      return this.questionService.getQuestionsCount();
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_GETTING, HttpStatus.BAD_REQUEST);
    };
  }

  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @UseGuards(AuthGuard('jwt'))
  @Post('answers')
  async createAnswer(@Body() data: CreateAnswerDto, @Req() req: AuthRequest,
    @UploadedFiles() images?: Array<Express.Multer.File>): Promise<AnswerModel> {

    if (!req.user) {
      throw new UnauthorizedException(API_MESSAGES.UNAUTHORIZED_RES);
    }

    const { body, questionId } = data;
    const currentDate = new Date();

    const creationData = {
      body,
      files: undefined,
      created_at: currentDate,
      updated_at: currentDate,
      author: { connect: { id: req.user.id } },
      question: { connect: { id: Number(questionId) } },
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
        creationData.files = { connect: imagesArray.map(id => ({ id })) };
      }
      return this.questionService.createAnswer(creationData);
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('answers/up/:id')
  async voteUp(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest): Promise<void> {
    const user = await this.userService.findOne({ id: req.user.id });

    try {
      if (user.likedAnswers.includes(id)) {
        await this.userService.updateUser({
          where: { id: user.id },
          data: {
            likedAnswers: [...user.likedAnswers.filter(item => item != id)]
          }
        });
        await this.questionService.updateAnswer({
          where: { id },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: user.id },
          data: {
            likedAnswers: [...user.likedAnswers, id]
          }
        });
        await this.questionService.updateAnswer({
          where: { id },
          data: {
            rating: {
              increment: 1
            }
          }
        });
      }
      if (user.dislikedAnswers.includes(id)) {
        await this.questionService.updateAnswer({
          where: { id },
          data: {
            rating: {
              increment: 1
            }
          }
        });
        await this.userService.updateUser({
          where: { id: user.id },
          data: {
            dislikedAnswers: [...user.dislikedAnswers.filter(item => item != id)]
          }
        });
      }
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.EDITING_FAIL, HttpStatus.BAD_REQUEST);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('answers/down/:id')
  async voteDown(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest): Promise<void> {
    const user = await this.userService.findOne({ id: req.user.id });

    try {
      if (user.dislikedAnswers.includes(id)) {
        await this.userService.updateUser({
          where: { id: user.id },
          data: {
            dislikedAnswers: [...user.dislikedAnswers.filter(item => item != id)]
          }
        });
        await this.questionService.updateAnswer({
          where: { id },
          data: {
            rating: {
              increment: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: user.id },
          data: {
            dislikedAnswers: [...user.dislikedAnswers, id]
          }
        });
        await this.questionService.updateAnswer({
          where: { id },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      }
      if (user.likedAnswers.includes(id)) {
        await this.questionService.updateAnswer({
          where: { id },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
        await this.userService.updateUser({
          where: { id: user.id },
          data: {
            likedAnswers: [...user.likedAnswers.filter(item => item != id)]
          }
        });
      }
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.EDITING_FAIL, HttpStatus.BAD_REQUEST);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('answers/:answerId')
  async deleteAnswerById(@Param('answerId', ParseIntPipe) answerId: number,): Promise<AnswerModel> {
    try {
      return await this.questionService.deleteAnswer({ id: answerId });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.DELETE_FAIL, HttpStatus.BAD_REQUEST);
    };
  }
}
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Question, Prisma, Keyword } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { API_MESSAGES } from 'src/constants/api-messages';
import { FileService } from 'src/file/file.service';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(private prisma: PrismaService,
    private readonly fileService: FileService,
  ) { }

  async createQuestion(data: Prisma.QuestionCreateInput): Promise<Question> {
    try {
      return this.prisma.question.create({ data });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_CREATING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async getQuestion(questionWhereUniqueInput: Prisma.QuestionWhereUniqueInput,): Promise<Question> {
    try {
      const result = this.prisma.question.findUnique({
        where: questionWhereUniqueInput,
        include: {
          author: true, keywords: true, answers: {
            include: { files: true, author: true }, orderBy: [
              { rating: 'desc' },
              { id: 'asc' },
            ],
          }, files: true, savedBy: {
            select: {
              id: true
            }
          }
        }
      });
      if (!result) throw new HttpException(`Question ${questionWhereUniqueInput.id} not exists `, HttpStatus.NOT_FOUND);
      return result;
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  async getQuestions(params: {
    skip?: number; where?: Prisma.QuestionWhereInput; orderBy?: Prisma.QuestionOrderByWithRelationInput; userID?: string;
  }): Promise<Question[]> {
    let { skip, where, orderBy, userID } = params;
    if (userID) {
      where = { ...where, author: { id: +userID } };
    }
    try {
      return this.prisma.question.findMany({
        skip, where, orderBy, take: 5,
        include: {
          keywords: true, author: {
            select: { id: true, firstname: true, lastname: true, activity: true },
          }, savedBy: {
            select: {
              id: true
            },
          }, answers: true, files: true
        }
      });
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  async updateQuestion(params: {
    where: Prisma.QuestionWhereUniqueInput;
    data: Prisma.QuestionUpdateInput;
  }): Promise<Question> {
    const { data, where } = params;
    try {
      const question = await this.getQuestion(params.where);
      if (!question) throw new HttpException(`Question ${where.id} not exists `, HttpStatus.NOT_FOUND);
      else return this.prisma.question.update({ where, data });
    } catch (err) {
      this.logger.error(API_MESSAGES.EDITING_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async deleteQuestion(where: Prisma.QuestionWhereUniqueInput): Promise<Question> {
    try {
      const question = await this.prisma.question.findUnique({ where, include: { files: true, answers: true } });
      if (question.files.length)
        question.files.forEach(async file => {
          await this.fileService.deleteFileById({ id: file.id });
        });
      // if (question.answers.length) {
      //   const deleteAnswers = question.answers.map(async answer => {
      //     await this.answerService.deleteAnswer({ id: answer.id });
      //   });
      //   await Promise.all(deleteAnswers);
      // }
      return this.prisma.question.delete({ where });
    } catch (err) {
      this.logger.error(API_MESSAGES.DELETE_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async getKeywords(take?: number): Promise<Keyword[]> {
    try {
      return take ? this.prisma.keyword.findMany({ take }) : this.prisma.keyword.findMany();
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.NOT_FOUND);
    };
  }

  async addQuestionToFavorites(userID: number, id: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userID },
        data: {
          savedQuestions: {
            connect: { id },
          },
        },
      });
    } catch (err) {
      this.logger.error(API_MESSAGES.EDITING_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async removeFromFavorites(userID: number, questionId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userID },
        data: {
          savedQuestions: {
            disconnect: { id: questionId },
          },
        },
      });
    } catch (err) {
      this.logger.error(API_MESSAGES.EDITING_FAIL, err.stack);
      throw new HttpException(API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  async getQuestionsCount(): Promise<number> {
    try {
      return await this.prisma.question.count();
    } catch (err) {
      this.logger.error(API_MESSAGES.FAIL_GETTING, err.stack);
      throw new HttpException(API_MESSAGES.FAIL_GETTING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }
}
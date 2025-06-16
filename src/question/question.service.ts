import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Question, Prisma, Keyword } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { FileService } from 'src/file/file.service';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService,
    private readonly fileService: FileService,
  ) { }

  async createQuestion(data: Prisma.QuestionCreateInput): Promise<Question> {
    try {
      return this.prisma.question.create({ data });
    } catch (err) {
      console.error(err.message);
    };
  }

  async getQuestion(
    questionWhereUniqueInput: Prisma.QuestionWhereUniqueInput,
  ): Promise<Question | null> {
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
      console.error(err.message);
    };
  }

  async getQuestions(params: {
    skip?: number;
    where?: Prisma.QuestionWhereInput;
    orderBy?: Prisma.QuestionOrderByWithRelationInput;
    userID?: string;
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
      console.error(err.message);
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
      console.error(err.message);
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
      console.error(err.message);
    };
  }

  async getKeywords(take?: number): Promise<Keyword[]> {
    try {
      return take ? this.prisma.keyword.findMany({ take }) : this.prisma.keyword.findMany();
    } catch (err) {
      console.error(err.message);
    };
  }


  async addQuestionToFavorites(userID: string, id: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: +userID },
        data: {
          savedQuestions: {
            connect: { id },
          },
        },
      });
    } catch (err) {
      console.error(err.message);
    };
  }

  async removeFromFavorites(userID: string, questionId: number) {
    await this.prisma.user.update({
      where: { id: +userID },
      data: {
        savedQuestions: {
          disconnect: { id: questionId },
        },
      },
    });
  }

  async createKeyword(data: Prisma.KeywordCreateInput): Promise<Keyword> {
    try {
      return this.prisma.keyword.create({ data });
    } catch (err) {
      console.error(err.message);
    };
  }

  async getQuestionsCount(): Promise<number> {
    try {
      return await this.prisma.question.count();
    } catch (err) {
      console.error(err.message);
    };
  }

  async checkKeywordAndCreate({ body }: { body: string; }): Promise<number> {
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
}
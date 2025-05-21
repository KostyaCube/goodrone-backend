import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { API_MESSAGES } from 'src/constants/api-messages';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) { }

  async create(createUserDto: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({ data: createUserDto });
    } catch (err) {
      this.logger.error(`${API_MESSAGES.USER_EXISTS}: ${err.message}`);
      throw new HttpException(API_MESSAGES.USER_EXISTS, HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: userWhereUniqueInput,
        include: {
          savedQuestions: { include: { author: true, answers: true, keywords: true } },
          savedPosts: true,
          subscriptions: {
            include: {
              subscribedTo: { select: { id: true, firstname: true, lastname: true, activity: true } },
            },
          },
          subscribers: {
            include: {
              subscriber: { select: { id: true, firstname: true, lastname: true, activity: true } },
            },
          },
        },
      });

      if (!user) {
        throw new HttpException(API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (err) {
      this.logger.warn(`${API_MESSAGES.LOGIN_ERR}:  ${err.message}`);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(API_MESSAGES.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

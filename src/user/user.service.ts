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
      await this.prisma.user.create({ data: createUserDto });
      return this.findOne({ email: createUserDto.email });
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

      return user;
    } catch (err) {
      this.logger.warn(`${API_MESSAGES.INVALID_ID}:  ${err.message}`);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(API_MESSAGES.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUser(params: { where: Prisma.UserWhereUniqueInput; data: Prisma.UserUpdateInput; }): Promise<User> {
    const { where, data } = params;
    try {
      return this.prisma.user.update({ data, where, });
    } catch (err) {
      this.logger.warn(`${API_MESSAGES.UNKNOWN_ERROR}:  ${err.message}`);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(API_MESSAGES.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }
}

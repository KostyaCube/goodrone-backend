import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: Prisma.UserCreateInput) {
    try {
      return this.prisma.user.create({ data: createUserDto });
    } catch (err) {
      console.error(err.message);
    }
  }

  async findOne(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null | undefined> {
    try {
      return this.prisma.user.findUnique({
        where: userWhereUniqueInput,
        include: {
          savedQuestions: { include: { author: true, answers: true, keywords: true } },
          savedPosts: true,
          subscriptions: {
            include: {
              subscribedTo: { select: { id: true, firstname: true, lastname: true } },
            },
          },
          subscribers: {
            include: {
              subscriber: { select: { id: true, firstname: true, lastname: true } },
            },
          },
        },
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

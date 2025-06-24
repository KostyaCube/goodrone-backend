import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'prisma/prisma.service';
import { PostModule } from 'src/post/post.module';
import { QuestionModule } from 'src/question/question.module';

@Module({
  imports: [PostModule, QuestionModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [PrismaService, UserService],
})
export class UserModule { }

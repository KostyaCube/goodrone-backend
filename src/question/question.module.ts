import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PrismaService } from 'prisma/prisma.service';
import { PrismaModule } from 'prisma/prisma.module';
import { FileModule } from 'src/file/file.module';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [PrismaModule, FileModule, PostModule],
  controllers: [QuestionController],
  providers: [QuestionService, PrismaService],
  exports: [QuestionService]
})
export class QuestionModule { }

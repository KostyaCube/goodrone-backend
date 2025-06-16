import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PrismaService } from 'prisma/prisma.service';
import { PrismaModule } from 'prisma/prisma.module';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [QuestionController],
  providers: [QuestionService, PrismaService],
})
export class QuestionModule { }

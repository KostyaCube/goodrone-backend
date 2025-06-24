import { forwardRef, Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PrismaService } from 'prisma/prisma.service';
import { PrismaModule } from 'prisma/prisma.module';
import { FileModule } from 'src/file/file.module';
import { PostModule } from 'src/post/post.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [PrismaModule, FileModule, PostModule, forwardRef(() => UserModule),],
  controllers: [QuestionController],
  providers: [QuestionService, PrismaService, UserService],
  exports: [QuestionService]
})
export class QuestionModule { }

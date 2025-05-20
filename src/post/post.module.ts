import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from 'prisma/prisma.service';
import { FileModule } from 'src/file/file.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [PostController],
  providers: [PostService, PrismaService],
  exports: [PostService],
})
export class PostModule { }

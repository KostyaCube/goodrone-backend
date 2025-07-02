import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaService } from 'prisma/prisma.service';
import { FileModule } from 'src/file/file.module';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService],
  imports: [FileModule],
  exports: [ProfileService]
})
export class ProfileModule { }

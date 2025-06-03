import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { FileModule } from './file/file.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [AuthModule, UserModule, PostModule, FileModule, ProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

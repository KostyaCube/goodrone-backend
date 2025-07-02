import {
  Controller, Get, Post, Put, Delete, Body, Query,
  UseInterceptors, UploadedFiles, Param, HttpException, HttpStatus,
  UseGuards, Req,
  ParseIntPipe,
  NotFoundException
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { editFileName, imageFileFilter } from 'src/file/file.utils';
import { FileService } from 'src/file/file.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthRequest } from 'src/auth/jwt.strategy';
import { diskStorage } from 'multer';
import { API_MESSAGES } from 'src/constants/api-messages';
import { UpdateProfileDto } from './dto/create-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService, private readonly fileService: FileService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get(':userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<Profile> {
    return await this.profileService.findByUserId(userId);
  }

  @UseInterceptors(FilesInterceptor('images', 1, {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @UseGuards(AuthGuard('jwt'))
  @Post('avatar')
  async addAavatar(@Req() req: AuthRequest, @UploadedFiles() image: Express.Multer.File): Promise<string> {
    const profile = await this.profileService.findByUserId(req.user.id);

    if (!profile) {
      throw new NotFoundException(API_MESSAGES.NOT_FOUND);
    }
    const photoUrl = `${process.env.HOST}:${process.env.PORT}/file/${image.filename}`;

    try {
      const savedImage = await this.fileService.createFile({ link: photoUrl });

      await this.profileService.updateProfile({
        where: { id: profile.id },
        data: { avatar: { connect: { id: savedImage.id } } }
      });

      return savedImage.link;
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.FAIL_CREATING, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('profile/:id')
  async editProfile(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProfileDto, @Req() req: AuthRequest): Promise<Profile> {
    const { bio, location, website, birthdate, gender, phone, } = data;

    try {
      return await this.profileService.updateProfile({
        where: { userId: req.user.id },
        data: { bio, location, website, birthdate, gender, phone }
      });
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }
}

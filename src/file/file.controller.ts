import {
  Controller,
  Get,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  HttpException,
  HttpStatus,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as FileEntity } from '@prisma/client';
import { diskStorage } from 'multer';
import { Express, Response } from 'express';
import { FileService } from './file.service';
import { editFileName, imageFileFilter } from './file.utils';
import { API_MESSAGES } from 'src/constants/api-messages';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Get(':imagename')
  async getImage(@Param('imagename') image: string, @Res() res: Response): Promise<void> {
    try {
      return res.sendFile(image, { root: './uploads' }, (err) => {
        if (err) {
          throw new HttpException(API_MESSAGES.IMAGE_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
      });
    } catch (err) {
      throw new HttpException(API_MESSAGES.IMAGE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteImageById(@Param('id') id: string): Promise<{ message: string; }> {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new HttpException(API_MESSAGES.INVALID_ID, HttpStatus.BAD_REQUEST);
    }

    try {
      await this.fileService.deleteFileById({ id: numericId });
      return { message: API_MESSAGES.DELETED };
    } catch (e) {
      throw new HttpException(API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: editFileName,
    }),
    fileFilter: imageFileFilter
  }))
  @Post('image-upload')
  async uploadFile(@UploadedFile() image: Express.Multer.File): Promise<FileEntity> {
    if (!image) {
      throw new HttpException(API_MESSAGES.NO_FILE, HttpStatus.BAD_REQUEST);
    }

    const photoUrl = `${process.env.HOST}:${process.env.PORT}/file/${image.filename}`;
    try {
      return await this.fileService.createFile({
        created_at: new Date(),
        link: photoUrl,
      });
    } catch (err) {
      throw new HttpException(API_MESSAGES.UPLOAD_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

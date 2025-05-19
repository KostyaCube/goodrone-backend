import { Controller, Get, Delete, Res, Param, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from './file.utils';
import { File as FileEntity } from '@prisma/client';


@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Get(':imagename')
  getImage(@Param('imagename') image: string, @Res() res: Response): { status: HttpStatus; data: void; } {
    try {
      const response = res.sendFile(image, { root: './uploads' });
      return {
        status: HttpStatus.OK,
        data: response,
      };
    } catch (err) {
      throw new Error(err);
    }
  }

  @Delete(':id')
  async deleteImageById(@Param('id') id: string): Promise<void> {
    try {
      await this.fileService.deleteFileById({ id: Number(id) });
    } catch (e) {
      console.error(e);
    }
  }

  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({ destination: './uploads', filename: editFileName }),
    fileFilter: imageFileFilter
  }))
  @Post('image-upload')
  async uploadFile(@UploadedFile() image: File): Promise<FileEntity> {
    const photoUrl = `${process.env.HOST}/file/${image.name}`;
    try {
      return await this.fileService.createFile({
        created_at: new Date(),
        link: photoUrl,
      });

    } catch (err) {
      console.error(err.message);
    };
  }
}
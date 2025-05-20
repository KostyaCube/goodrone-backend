import * as fs from 'fs/promises';
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma, File } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { API_MESSAGES } from 'src/constants/api-messages';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(private prisma: PrismaService) { }

  async createFile(data: Prisma.FileCreateInput): Promise<File> {
    try {
      return await this.prisma.file.create({ data });
    } catch (err) {
      this.logger.error(`${API_MESSAGES.FAIL_CREATING_FILE}: ${err.message}`);
      throw new HttpException(API_MESSAGES.FAIL_CREATING_FILE, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getFileInfoById(id: Prisma.FileWhereUniqueInput): Promise<File> {
    try {
      const file = await this.prisma.file.findUnique({ where: id });
      if (!file) {
        throw new HttpException(API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      return file;
    } catch (err) {
      this.logger.error(`${API_MESSAGES.FAIL_GETTING_FILE}: ${err.message}`);
      throw new HttpException(API_MESSAGES.FAIL_GETTING_FILE, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteFileById(id: Prisma.FileWhereUniqueInput): Promise<File> {
    const file = await this.prisma.file.findUnique({ where: id });

    if (!file) {
      throw new HttpException(API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.deletePhysicalFile(file.link);

    try {
      return await this.prisma.file.delete({ where: id });
    } catch (err) {
      this.logger.error(`${API_MESSAGES.DELETE_FAIL}: ${err.message}`);
      throw new HttpException(API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteFileByLink(link: string): Promise<File> {
    const file = await this.prisma.file.findFirst({ where: { link } });

    if (!file) {
      throw new HttpException(API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.deletePhysicalFile(link);

    try {
      return await this.prisma.file.delete({ where: { id: file.id } });
    } catch (err) {
      this.logger.error(`${API_MESSAGES.DELETE_FAIL}: ${err.message}`);
      throw new HttpException(API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async deletePhysicalFile(link: string): Promise<void> {
    const filename = this.extractFilenameFromLink(link);
    try {
      await fs.unlink(`./uploads/${filename}`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.logger.warn(`${API_MESSAGES.NOT_FOUND}: ${filename}`);
      } else {
        this.logger.error(`${API_MESSAGES.DELETE_FAIL}: ${err.message}`);
        throw new HttpException(API_MESSAGES.DELETE_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  private extractFilenameFromLink(link: string): string {
    return link.split('/').pop() || '';
  }

  extractImageSrcs(htmlBody: string): string[] {
    const regex = /<img[^>]+src="([^">]+)"/g;
    const srcs: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(htmlBody)) !== null) {
      srcs.push(match[1]);
    }
    return srcs;
  }
}

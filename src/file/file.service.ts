import * as fs from 'fs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, File } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) { }

  async createFile(data: Prisma.FileCreateInput): Promise<File> {
    try {
      return this.prisma.file.create({ data });
    } catch (err) {
      console.error(err.message);
    };
  }

  async getFileInfoById(id: Prisma.FileWhereUniqueInput): Promise<File> {
    try {
      return this.prisma.file.findUnique({ where: id });
    } catch (err) {
      console.error(err.message);
    };
  }

  async deleteFileById(id: Prisma.FileWhereUniqueInput): Promise<File> {
    const file = await this.prisma.file.findUnique({ where: id });

    if (file) {
      const path = file.link.split('/');
      const name = path[path.length - 1];
      try {
        await fs.promises.unlink(`./uploads/${name}`);
      } catch (err) {
        console.log(err.message);
      };
      return await this.prisma.file.delete({ where: id });
    } else throw new HttpException('File not found ', HttpStatus.NOT_FOUND);
  }

  async deleteFileByLink(link: string): Promise<File> {
    const file = await this.prisma.file.findFirst({ where: { link } });
    if (file) {

      const path = file.link.split('/');
      const name = path[path.length - 1];
      try {
        await fs.promises.unlink(`./uploads/${name}`);
      } catch (err) {
        console.log(err.message);
      };
      return await this.prisma.file.delete({ where: { id: file.id } });
    } else throw new HttpException('File not found ', HttpStatus.NOT_FOUND);
  }

  extractImageSrcs(htmlBody: string) {
    const regex = /<img[^>]+src="([^">]+)"/g;
    let matches: string[];
    const srcs = [];

    while ((matches = regex.exec(htmlBody)) !== null) {
      srcs.push(matches[1]);
    }
    return srcs;
  }
}
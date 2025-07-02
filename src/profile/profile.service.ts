import { Injectable, NotFoundException, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { PrismaService } from 'prisma/prisma.service';
import { API_MESSAGES } from 'src/constants/api-messages';
import { Prisma, Profile } from '@prisma/client';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  constructor(private prisma: PrismaService) { }

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    try {
      return await this.prisma.profile.create({ data: createProfileDto });
    } catch (error) {
      throw new BadRequestException(API_MESSAGES.FAIL_CREATING);
    }
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(API_MESSAGES.NOT_FOUND);
    }
    return profile;
  }

  async updateProfile(params: { where: Prisma.ProfileWhereUniqueInput; data: Prisma.ProfileUpdateInput; }): Promise<Profile> {
    const { where, data } = params;
    try {
      return this.prisma.profile.update({ data, where, });
    } catch (err) {
      this.logger.warn(`${API_MESSAGES.UNKNOWN_ERROR}:  ${err.message}`);

      throw new HttpException(API_MESSAGES.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }
}

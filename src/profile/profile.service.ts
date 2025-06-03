import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { PrismaService } from 'prisma/prisma.service';
import { API_MESSAGES } from 'src/constants/api-messages';
import { Profile } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    try {
      return await this.prisma.profile.create({
        data: {
          ...createProfileDto,
          birthdate: createProfileDto.birthdate
            ? new Date(createProfileDto.birthdate)
            : undefined,
        },
      });
    } catch (error) {
      throw new BadRequestException(API_MESSAGES.FAIL_CREATING);
    }
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(API_MESSAGES.NOT_FOUND);
    }
    return profile;
  }
}

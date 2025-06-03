import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { Profile } from '@prisma/client';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Post()
  async create(@Body() dto: CreateProfileDto): Promise<Profile> {
    return await this.profileService.create(dto);
  }

  @Get(':userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<Profile> {
    return await this.profileService.findByUserId(userId);
  }
}

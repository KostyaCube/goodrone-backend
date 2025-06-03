import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get(':userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<Profile> {
    return await this.profileService.findByUserId(userId);
  }
}

import { Controller, Post, HttpException, HttpStatus, Get, Param, ParseIntPipe, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { PostService } from 'src/post/post.service';
import { API_MESSAGES } from 'src/constants/api-messages';
import { AuthGuard } from '@nestjs/passport';
import { QuestionService } from 'src/question/question.service';
import { AuthRequest } from 'src/auth/jwt.strategy';
import { User } from '@prisma/client';
import { UserCommonInfoDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly postService: PostService, private readonly questionService: QuestionService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getFullMyInfo(@Req() req: AuthRequest): Promise<Omit<User, 'password'>> {
    if (!req.user) {
      throw new UnauthorizedException(API_MESSAGES.UNAUTHORIZED_RES);
    }
    try {
      const user = await this.userService.findOne({ id: req.user.id });
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    };
  }

  @Get(':id')
  async getUserCommonInfoById(@Param('id', ParseIntPipe) id: number): Promise<UserCommonInfoDto> {
    try {
      const user = await this.userService.findOne({ id });
      return {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.profile ? user.profile.avatar : null,
        registered: user.registered,
        subscriptions: user.subscriptions,
        subscribers: user.subscribers,
      };
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('articles/like/:id')
  async likeDislikeArticle(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest): Promise<void> {

    try {
      const user = await this.userService.findOne({ id: req.user.id });
      if (user.likedArticles.includes(id)) {
        await this.userService.updateUser({
          where: { id: req.user.id },
          data: {
            likedArticles: [...user.likedArticles.filter(item => item != id)]
          }
        });
        await this.postService.updatePost({
          where: { id },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: req.user.id },
          data: {
            likedArticles: [...user.likedArticles, id]
          }
        });
        await this.postService.updatePost({
          where: { id },
          data: {
            rating: {
              increment: 1
            }
          }
        });
      }
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('comments/like/:id')
  async likeDislikeComment(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest): Promise<void> {

    try {
      const user = await this.userService.findOne({ id: req.user.id });
      if (user.likedComments.includes(id)) {
        await this.userService.updateUser({
          where: { id: req.user.id },
          data: {
            likedComments: [...user.likedComments.filter(item => item != id)]
          }
        });
        await this.postService.updateComment({
          where: { id },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: req.user.id },
          data: {
            likedComments: [...user.likedComments, id]
          }
        });
        await this.postService.updateComment({
          where: { id },
          data: {
            rating: {
              increment: 1
            }
          }
        });
      }
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('questions/like/:id')
  async likeDislikeQuestion(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest): Promise<void> {

    try {
      const user = await this.userService.findOne({ id: req.user.id });

      if (user.likedQuestions.includes(id)) {
        await this.userService.updateUser({
          where: { id: req.user.id },
          data: {
            likedQuestions: [...user.likedQuestions.filter(item => item != id)]
          }
        });
        await this.questionService.updateQuestion({
          where: { id },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: req.user.id },
          data: {
            likedQuestions: [...user.likedQuestions, id]
          }
        });
        await this.questionService.updateQuestion({
          where: { id },
          data: {
            rating: {
              increment: 1
            }
          }
        });
      }
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.EDITING_FAIL, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }
}

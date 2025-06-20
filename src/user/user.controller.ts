import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { PostService } from 'src/post/post.service';
import { API_MESSAGES } from 'src/constants/api-messages';
import { AuthGuard } from '@nestjs/passport';
import { QuestionService } from 'src/question/question.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly postService: PostService, private readonly questionService: QuestionService) { }

  @Get(':id')
  async getUserInfoById(@Param('id', ParseIntPipe) id: number): Promise<{ id: string, lastname: string, firstname: string, activity: string; }> {
    try {
      const user = await this.userService.findOne({ id });
      return { id: user.id.toString(), lastname: user.lastname, firstname: user.firstname, activity: user.activity };
    } catch (err) {
      throw new HttpException(err.message || API_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('articles/like')
  async likeDislikeArticle(
    @Body() userData: { userId: number; articleId: number; }): Promise<void> {
    const { userId, articleId } = userData;

    try {
      const user = await this.userService.findOne({ id: userId });
      if (user.likedArticles.includes(articleId)) {
        await this.userService.updateUser({
          where: { id: userId },
          data: {
            likedArticles: [...user.likedArticles.filter(item => item != articleId)]
          }
        });
        await this.postService.updatePost({
          where: { id: Number(articleId) },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: userId },
          data: {
            likedArticles: [...user.likedArticles, articleId]
          }
        });
        await this.postService.updatePost({
          where: { id: articleId },
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
  @Post('comments/like')
  async likeDislikeComment(@Body() userData: { userId: number; commentId: number; }): Promise<void> {
    const { userId, commentId } = userData;

    try {
      const user = await this.userService.findOne({ id: userId });
      if (user.likedComments.includes(commentId)) {
        await this.userService.updateUser({
          where: { id: userId },
          data: {
            likedComments: [...user.likedComments.filter(item => item != commentId)]
          }
        });
        await this.postService.updateComment({
          where: { id: Number(commentId) },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: userId },
          data: {
            likedComments: [...user.likedComments, commentId]
          }
        });
        await this.postService.updateComment({
          where: { id: commentId },
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

  @Post('questions/like')
  async likeDislikeQuestion(@Body() userData: { userId: number; questionId: number; }): Promise<void> {

    const { userId, questionId } = userData;
    try {
      const user = await this.userService.findOne({ id: userId });

      if (user.likedQuestions.includes(questionId)) {
        await this.userService.updateUser({
          where: { id: userId },
          data: {
            likedQuestions: [...user.likedQuestions.filter(item => item != questionId)]
          }
        });
        await this.questionService.updateQuestion({
          where: { id: Number(questionId) },
          data: {
            rating: {
              decrement: 1
            }
          }
        });
      } else {
        await this.userService.updateUser({
          where: { id: userId },
          data: {
            likedQuestions: [...user.likedQuestions, questionId]
          }
        });
        await this.questionService.updateQuestion({
          where: { id: questionId },
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

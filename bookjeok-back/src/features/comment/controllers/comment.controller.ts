import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';

import { OptionalJwtAuthGuard } from '@/features/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

import { CommentService } from '../services/comment.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { GetCommentsDto } from '../dto/get-comments.dto';

@ApiTags('댓글 (Comment)')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * 내 댓글 목록 조회 (페이지네이션)
   */
  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '내 댓글 목록 조회',
    description: '내가 작성한 댓글 목록을 페이지네이션으로 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 댓글 목록을 반환합니다.',
  })
  async getMyComments(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @CurrentUser() user: User,
  ) {
    return this.commentService.getMyComments(user.id, page, limit);
  }

  /**
   * 댓글 목록 조회 (페이지네이션)
   * 로그인한 경우 좋아요 상태(isLiked)도 함께 반환
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '댓글 목록 조회',
    description:
      '특정 타겟(도서/리뷰)의 댓글 목록을 페이지네이션으로 조회합니다. 로그인 시 좋아요 상태도 반환됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '댓글 목록을 반환합니다.',
  })
  async getComments(
    @Query() query: GetCommentsDto,
    @CurrentUser() user: User | null,
  ) {
    return this.commentService.getComments(query, user?.id);
  }

  /**
   * 댓글 작성
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '댓글 작성',
    description: '새로운 댓글을 작성합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '댓글이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자입니다.',
  })
  async createComment(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.createComment(dto, user.id);
  }

  /**
   * 댓글 수정
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '댓글 수정',
    description: '작성한 댓글을 수정합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '댓글이 성공적으로 수정되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '본인이 작성한 댓글만 수정할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.updateComment(id, dto, user.id);
  }

  /**
   * 댓글 삭제
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '댓글 삭제',
    description: '작성한 댓글을 삭제합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '댓글이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '본인이 작성한 댓글만 삭제할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.commentService.deleteComment(id, user.id);
  }

  /**
   * 좋아요 토글
   */
  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '댓글 좋아요 토글',
    description: '댓글에 좋아요를 추가하거나 취소합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '좋아요가 성공적으로 반영되었습니다.',
  })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  async toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.commentService.toggleLike(id, user.id);
  }

  /**
   * 내 좋아요 상태 조회
   */
  @Get(':id/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '내 좋아요 상태 조회',
    description: '특정 댓글에 대한 나의 좋아요 상태를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '좋아요 상태를 반환합니다.',
  })
  @ApiParam({ name: 'id', description: '댓글 ID' })
  async getMyLikeStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const isLiked = await this.commentService.getMyLikeStatus(id, user.id);
    return { isLiked };
  }
}

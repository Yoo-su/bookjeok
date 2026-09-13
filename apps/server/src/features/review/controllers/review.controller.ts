import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { OptionalJwtAuthGuard } from '@/features/auth/guards/optional-jwt-auth.guard';
import { BookResolvePipe } from '@/features/book/pipes/book-resolve.pipe';
import { Review } from '@/features/review/entities/review.entity';
import { ReviewReactionType } from '@/features/review/entities/review-reaction.entity';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';
import { InvalidateCache } from '@/shared/cache/decorators/invalidate-cache.decorator';
import { SmartCache } from '@/shared/cache/decorators/smart-cache.decorator';
import { IdempotencyInterceptor } from '@/shared/interceptors/idempotency.interceptor';

import { CreateReviewDto } from '../dtos/create-review.dto';
import { GetReviewsQueryDto } from '../dtos/get-reviews-query.dto';
import {
  GetReviewsResponseDto,
  ReviewFeedDto,
  ReviewResponseDto,
} from '../dtos/review-response.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { ViewCountInterceptor } from '../interceptors/view-count.interceptor';
import { ReviewService } from '../services/review.service';

@ApiTags('리뷰 (Review)')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(IdempotencyInterceptor)
  @InvalidateCache('reviews', 'reviews-popular')
  @TrackActivity(ActivityType.REVIEW_CREATE, (req) => ({ isbn: req.body.isbn }))
  @ApiOperation({
    summary: '리뷰 작성',
    description: '새로운 리뷰를 작성합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '리뷰가 성공적으로 생성되었습니다.',
    type: Review,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자입니다.',
  })
  async create(
    @Body(BookResolvePipe) createReviewDto: CreateReviewDto,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return await this.reviewService.create(createReviewDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: '리뷰 목록 조회',
    description: '필터링 조건에 따라 리뷰 목록을 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰 목록을 반환합니다.',
    type: GetReviewsResponseDto,
  })
  async findAll(
    @Query() query: GetReviewsQueryDto,
  ): Promise<GetReviewsResponseDto> {
    return await this.reviewService.findAll(query);
  }

  @Get('feeds')
  @ApiOperation({
    summary: '카테고리별 리뷰 피드 조회',
    description: '카테고리별 최신 리뷰 피드를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카테고리별 리뷰 피드 목록을 반환합니다.',
    type: [ReviewFeedDto],
  })
  async findFeeds(): Promise<ReviewFeedDto[]> {
    return await this.reviewService.findFeeds();
  }

  @Get('popular')
  @SmartCache({ prefix: 'reviews-popular', ttl: 180000, keyStrategy: 'global' })
  @ApiOperation({
    summary: '인기 리뷰 조회',
    description: '조회수와 리액션 수를 기준으로 인기 리뷰를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '인기 리뷰 목록을 반환합니다.',
    type: [ReviewResponseDto],
  })
  async findPopular(): Promise<ReviewResponseDto[]> {
    return await this.reviewService.findPopular();
  }

  @Get(':id/edit')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '리뷰 수정용 데이터 조회',
    description:
      '본인의 리뷰 데이터만 반환합니다. 본인 리뷰가 아니면 403 Forbidden.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰 수정 데이터를 반환합니다.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '수정 권한이 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  async getReviewForEdit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ReviewResponseDto> {
    return await this.reviewService.findOneForEdit(id, user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '리뷰 상세 조회',
    description:
      '특정 리뷰의 상세 정보를 조회합니다. 비공개 리뷰는 작성자 본인만 조회 가능합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰 상세 정보를 반환합니다.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '비공개 리뷰입니다.',
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User | null,
  ): Promise<ReviewResponseDto> {
    return await this.reviewService.findOne(id, user?.id);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(ViewCountInterceptor)
  @TrackActivity(ActivityType.REVIEW_VIEW, (req) => ({ id: req.params.id }))
  @ApiOperation({
    summary: '리뷰 조회수 기록',
    description: '리뷰 상세페이지 접근 시 조회수를 기록합니다.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '조회수가 기록되었습니다.',
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  recordView(@Param('id', ParseIntPipe) _id: number): void {
    // 인터셉터에서 조회수 및 활동 로그 처리
  }

  @Get(':id/recommend')
  @ApiOperation({
    summary: '추천 리뷰 조회',
    description:
      '같은 작가의 다른 책 리뷰(최대 2개) + 같은 카테고리 리뷰를 조합하여 추천합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '추천 리뷰 목록을 반환합니다.',
    type: [ReviewResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  async getRecommendedReviews(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReviewResponseDto[]> {
    return await this.reviewService.getRecommendedReviews(id);
  }

  @Post(':id/reactions')
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.REVIEW_REACTION, (req) => ({
    id: req.params.id,
    type: req.body.type,
  }))
  @ApiOperation({
    summary: '리뷰 리액션 토글',
    description: '리뷰에 대한 리액션을 추가하거나 제거합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리액션이 성공적으로 반영되었습니다.',
    type: ReviewResponseDto,
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  async toggleReaction(
    @Param('id', ParseIntPipe) id: number,
    @Body('type') type: ReviewReactionType,
    @CurrentUser() user: User,
  ): Promise<ReviewResponseDto> {
    return await this.reviewService.toggleReaction(id, user.id, type);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @InvalidateCache('reviews', 'reviews-popular')
  @TrackActivity(ActivityType.REVIEW_UPDATE, (req) => ({ id: req.params.id }))
  @ApiOperation({
    summary: '리뷰 수정',
    description: '작성한 리뷰를 수정합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰가 성공적으로 수정되었습니다.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '권한이 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: User,
  ): Promise<ReviewResponseDto> {
    return await this.reviewService.update(id, updateReviewDto, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @InvalidateCache('reviews', 'reviews-popular')
  @TrackActivity(ActivityType.REVIEW_DELETE, (req) => ({ id: req.params.id }))
  @ApiOperation({
    summary: '리뷰 삭제',
    description: '작성한 리뷰를 삭제합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰가 성공적으로 삭제되었습니다.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '권한이 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ReviewResponseDto> {
    return await this.reviewService.remove(id, user.id, user.role);
  }

  @Get(':id/reaction')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '내 리액션 조회',
    description: '특정 리뷰에 대한 나의 리액션 정보를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '나의 리액션 타입을 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  async getMyReaction(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return await this.reviewService.getMyReaction(id, user.id);
  }
}

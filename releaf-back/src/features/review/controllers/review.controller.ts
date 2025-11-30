import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

import { CreateReviewDto } from '../dto/create-review.dto';
import { GetReviewsQueryDto } from '../dto/get-reviews-query.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewService } from '../services/review.service';

import { Review } from '@/features/review/entities/review.entity';
import {
  GetReviewsResponseDto,
  ReviewFeedDto,
} from '../dto/review-response.dto';

@ApiTags('리뷰 (Review)')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewsService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
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
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return await this.reviewsService.create(createReviewDto, user.id);
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
    return await this.reviewsService.findAll(query);
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
    return await this.reviewsService.findFeeds();
  }

  @Get(':id')
  @ApiOperation({
    summary: '리뷰 상세 조회',
    description: '특정 리뷰의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰 상세 정보를 반환합니다.',
    type: Review,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Review> {
    return await this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '리뷰 수정',
    description: '작성한 리뷰를 수정합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰가 성공적으로 수정되었습니다.',
    type: Review,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '권한이 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return await this.reviewsService.update(id, updateReviewDto, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '리뷰 삭제',
    description: '작성한 리뷰를 삭제합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '리뷰가 성공적으로 삭제되었습니다.',
    type: Review,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '권한이 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '리뷰를 찾을 수 없습니다.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return await this.reviewsService.remove(id, user.id);
  }
}

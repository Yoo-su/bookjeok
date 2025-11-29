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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

import { Review } from '@/features/review/entities/review.entity';
import {
  GetReviewsResponseDto,
  ReviewFeedDto,
} from './dto/review-response.dto';

@ApiTags('리뷰 (Review)')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '리뷰 작성' })
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return await this.reviewsService.create(createReviewDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '리뷰 목록 조회' })
  async findAll(
    @Query() query: GetReviewsQueryDto,
  ): Promise<GetReviewsResponseDto> {
    return await this.reviewsService.findAll(query);
  }

  @Get('feeds')
  @ApiOperation({ summary: '카테고리별 리뷰 피드 조회' })
  async findFeeds(): Promise<ReviewFeedDto[]> {
    return await this.reviewsService.findFeeds();
  }

  @Get(':id')
  @ApiOperation({ summary: '리뷰 상세 조회' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Review> {
    return await this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '리뷰 수정' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return await this.reviewsService.update(id, updateReviewDto, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '리뷰 삭제' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return await this.reviewsService.remove(id, user.id);
  }
}

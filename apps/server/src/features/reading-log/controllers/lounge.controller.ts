import {
  ActiveReadersResponse,
  LoungeBookReadersResponse,
  LoungeFeedResponse,
  LoungePopularResponse,
} from '@bookjeok/core';
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ReadingLogService } from '../services/reading-log.service';

@ApiTags('독서 라운지 (Reading Lounge)')
@Controller('reading-logs/lounge')
export class LoungeController {
  constructor(private readonly readingLogService: ReadingLogService) {}

  @Get()
  @ApiOperation({
    summary: '라운지 피드 조회',
    description:
      '모든 공개 사용자의 독서 기록을 책 단위로 그룹화하여 최신순으로 반환합니다. 인증 불필요.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '페이지네이션 커서 (이전 응답의 nextCursor)',
  })
  @ApiResponse({
    status: 200,
    description: '라운지 피드 목록을 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '커서 형식이 올바르지 않습니다.',
  })
  getLoungeFeed(@Query('cursor') cursor?: string): Promise<LoungeFeedResponse> {
    return this.readingLogService.getLoungeFeed(cursor);
  }

  @Get('popular')
  @ApiOperation({
    summary: '라운지 인기 도서 조회',
    description:
      '최근 1년간 가장 많이 읽힌 인기 도서 Top 10을 반환합니다. 인증 불필요.',
  })
  @ApiResponse({
    status: 200,
    description: '인기 도서 목록을 반환합니다.',
  })
  getLoungePopular(): Promise<LoungePopularResponse> {
    return this.readingLogService.getLoungePopular();
  }

  @Get('active-readers')
  @ApiOperation({
    summary: '라운지 열성 독서가 조회',
    description:
      '최근 3개월간 가장 활발하게 독서 기록을 남긴 공개 사용자 목록을 반환합니다. 인증 불필요.',
  })
  @ApiResponse({
    status: 200,
    description: '열성 독서가 목록을 반환합니다.',
  })
  getLoungeActiveReaders(): Promise<ActiveReadersResponse> {
    return this.readingLogService.getLoungeActiveReaders();
  }

  @Get('book/:isbn/readers')
  @ApiOperation({
    summary: '특정 도서의 전체 독자 목록 조회',
    description:
      '특정 ISBN의 도서를 읽은 모든 공개 사용자 목록을 커서 기반 페이지네이션으로 반환합니다. 상세 모달에서 사용됩니다.',
  })
  @ApiParam({ name: 'isbn', description: '도서 ISBN' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '페이지네이션 커서',
  })
  @ApiResponse({
    status: 200,
    description: '독자 목록을 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '커서 형식이 올바르지 않습니다.',
  })
  getLoungeBookReaders(
    @Param('isbn') isbn: string,
    @Query('cursor') cursor?: string,
  ): Promise<LoungeBookReadersResponse> {
    return this.readingLogService.getLoungeBookReaders(isbn, cursor);
  }
}

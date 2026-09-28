import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { RecordSearchKeywordDto } from '../dtos/record-search-keyword.dto';
import { SearchKeywordService } from '../services/search-keyword.service';

/**
 * 인기 검색어 컨트롤러
 * - 검색어 기록 및 인기 검색어 조회 API
 */
@ApiTags('인기 검색어 (Search Keyword)')
@Controller('search-keywords')
export class SearchKeywordController {
  constructor(private readonly searchKeywordService: SearchKeywordService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @TrackActivity(ActivityType.BOOK_SEARCH, (req) => ({
    keyword: req.body.keyword,
  }))
  @ApiOperation({
    summary: '검색어 기록',
    description:
      '도서 검색 시 검색어를 기록합니다. 인기 검색어 집계에 사용됩니다.',
  })
  @ApiResponse({ status: 204, description: '검색어가 기록되었습니다.' })
  recordSearchKeyword(@Body() dto: RecordSearchKeywordDto): void {
    // fire-and-forget 방식으로 처리 (비동기 완료 대기 안 함)
    void this.searchKeywordService.recordSearchKeyword(dto.keyword);
  }

  @Get('popular')
  @ApiOperation({
    summary: '인기 검색어 조회',
    description: '최근 1년 기준 인기 검색어 Top 10을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '인기 검색어 목록을 반환합니다.',
  })
  async getPopularKeywords() {
    return await this.searchKeywordService.findPopularKeywords();
  }
}

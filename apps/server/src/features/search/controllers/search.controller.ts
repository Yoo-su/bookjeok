import { SearchPreview } from '@bookjeok/core';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

import {
  AiSearchRequestDto,
  AiSearchResponseDto,
} from '@/features/search/dtos/ai-search.dto';
import { SearchPreviewQueryDto } from '@/features/search/dtos/search-preview.dto';
import { SearchService } from '@/features/search/services/search.service';
import { SearchPreviewService } from '@/features/search/services/search-preview.service';

@ApiTags('도서 AI 검색 (AI Search)')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly searchPreviewService: SearchPreviewService,
  ) {}

  @Get('preview')
  // 입력 중에 부르는 조회라 전역 한도(120회/분)보다 넉넉하게 둔다. 웹은 200ms 쉬었다 부른다
  @Throttle({ default: { limit: 240, ttl: 60000 } })
  @ApiOperation({
    summary: '상단바 통합 검색 미리보기',
    description:
      '도서 4권·공개 리뷰 3개·판매중/예약중 판매글 3개와 각 전체 건수를 반환합니다. 도서는 소개 전문검색 없이 서지만 찾습니다. 2글자 미만이면 빈 결과입니다.',
  })
  @ApiResponse({ status: 200, description: '영역별 미리보기와 전체 건수' })
  async preview(@Query() dto: SearchPreviewQueryDto): Promise<SearchPreview> {
    return await this.searchPreviewService.preview(dto.q);
  }

  @Post('ai')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1분당 최대 10회 호출 제한 (인증된 사용자 전용)
  @ApiOperation({
    summary: 'AI 추천 도서 검색 (Semantic Search + RAG)',
    description:
      '회원 전용 기능입니다. 사용자의 자연어 질문을 vector(768)로 임베딩 후 pgvector로 유사 도서를 탐색하고, Gemini Flash로 맞춤 추천 코멘트를 합성해 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI 도서 추천 결과 및 코멘트를 반환합니다.',
    type: AiSearchResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 유저의 접근입니다 (로그인 필요).',
  })
  async searchAi(
    @Body() dto: AiSearchRequestDto,
    @Req() req: { user?: { id: number } },
  ): Promise<AiSearchResponseDto> {
    return await this.searchService.searchAi(dto, req.user?.id);
  }

  @Post('ai/stream')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'AI 추천 도서 실시간 스트리밍 검색 (SSE)',
    description:
      '회원 전용 기능입니다. Server-Sent Events(SSE)를 통해 1차 의도분류, 후보 도서 카드, 2차 추천 사유 스트리밍을 실시간으로 전송합니다.',
  })
  async searchAiStream(
    @Body() dto: AiSearchRequestDto,
    @Req() req: { user?: { id: number } },
    @Res() res: Response,
  ): Promise<void> {
    await this.searchService.searchAiStream(dto, res, req.user?.id);
  }
}

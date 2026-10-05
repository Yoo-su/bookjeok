import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { BookSummaryDto } from '../dtos/book-summary.dto';
import { BookSummaryResponseDto } from '../dtos/book-summary-response.dto';
import { LlmService } from '../services/llm.service';

@ApiTags('AI 요약 (LLM)')
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('book-summary/:isbn')
  @ApiOperation({
    summary: '저장된 책 요약 조회',
    description: '기존에 생성되어 저장된 AI 도서 요약 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '저장된 요약 정보를 반환하거나 null을 반환합니다.',
  })
  async getSavedBookSummary(
    @Param('isbn') isbn: string,
  ): Promise<BookSummaryResponseDto | null> {
    const saved = await this.llmService.getSavedSummary(isbn);
    if (!saved) {
      return null;
    }
    return {
      summary: saved.summary,
      keyPoints: saved.keyPoints,
      targetAudience: saved.targetAudience,
      keywords: saved.keywords,
    };
  }

  @Post('book-summary')
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.LLM_BOOK_SUMMARY)
  @ApiOperation({
    summary: '책 요약 생성',
    description:
      'ISBN이 있으면 DB 서지로 생성해 저장하고(없는 도서는 404), 없으면 전달한 서지로 생성만 합니다.',
  })
  @ApiResponse({ status: 201, description: '생성된 요약 정보를 반환합니다.' })
  async getBookSummary(
    @Body(new ValidationPipe()) bookSummaryDto: BookSummaryDto,
    @Req() req: { user?: { id: number | string } },
  ): Promise<BookSummaryResponseDto> {
    const { title, author, description, isbn, publisher } = bookSummaryDto;
    const summary = await this.llmService.generateBookSummary(
      title,
      author,
      description,
      isbn,
      publisher,
      req.user?.id,
    );
    return summary;
  }
}

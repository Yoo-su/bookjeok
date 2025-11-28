import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { LlmService } from '../services/llm.service';
import { BookSummaryDto } from '../dtos/book-summary.dto';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI 요약 (LLM)')
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  /**
   * 책 요약 및 후기 생성 요청을 처리하는 엔드포인트
   * @param bookSummaryDto - 책 제목과 저자 정보
   */
  /**
   * 책 요약 및 후기 생성 요청을 처리하는 엔드포인트
   * @param bookSummaryDto - 책 제목과 저자 정보
   */
  @Post('book-summary')
  @ApiOperation({
    summary: '책 요약 생성',
    description: '책 제목과 저자 정보를 바탕으로 AI 요약 및 후기를 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '생성된 요약 정보를 반환합니다.' })
  async getBookSummary(
    @Body(new ValidationPipe()) bookSummaryDto: BookSummaryDto,
  ) {
    const { title, author, description } = bookSummaryDto;
    const summary = await this.llmService.generateBookSummary(
      title,
      author,
      description,
    );
    return summary;
  }
}

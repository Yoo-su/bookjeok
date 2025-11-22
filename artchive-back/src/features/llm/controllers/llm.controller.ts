import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { LlmService } from '../services/llm.service';
import { BookSummaryDto } from '../dtos/book-summary.dto';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  /**
   * 책 요약 및 후기 생성 요청을 처리하는 엔드포인트
   * @param bookSummaryDto - 책 제목과 저자 정보
   */
  @Post('book-summary')
  async getBookSummary(
    @Body(new ValidationPipe()) bookSummaryDto: BookSummaryDto,
  ) {
    const { title, author } = bookSummaryDto;
    const summary = await this.llmService.generateBookSummary(title, author);
    return summary;
  }
}

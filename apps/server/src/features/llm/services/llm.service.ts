import {
  GenerativeModel,
  GoogleGenerativeAI,
  Schema,
  SchemaType,
} from '@google/generative-ai';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';
import { BusinessException } from '@/shared/exceptions';

import { MODEL_NAME } from '../constants/llm-model';
import { BookSummaryResponseDto } from '../dtos/book-summary-response.dto';
import { AiBookSummary } from '../entities/ai-book-summary.entity';
import { AiRequestLog } from '../entities/ai-request-log.entity';
import { getPromptText } from '../utils/get-prompt-text';

interface SummarySource {
  title: string;
  author: string;
  description?: string;
  publisher?: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  /**
   * ConfigService와 Repository들을 주입받습니다.
   */
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AiRequestLog)
    private readonly aiRequestLogRepository: Repository<AiRequestLog>,
    @InjectRepository(AiBookSummary)
    private readonly aiBookSummaryRepository: Repository<AiBookSummary>,
    private readonly bookService: BookService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
    });
  }

  /**
   * DB에서 기 저장된 AI 도서 요약을 조회합니다.
   * @param isbn - 도서 ISBN
   */
  async getSavedSummary(isbn: string): Promise<AiBookSummary | null> {
    return this.aiBookSummaryRepository.findOneBy({ isbn });
  }

  /**
   * ISBN이 있으면 저장본을 우선 반환하고, 없을 때만 DB의 정식 서지로 생성해 저장합니다.
   * ISBN 없는 요청은 전달받은 서지로 생성만 하고 저장하지 않습니다.
   */
  async generateBookSummary(
    title: string,
    author: string,
    description?: string,
    isbn?: string,
    publisher?: string,
    userId?: string | number,
  ): Promise<BookSummaryResponseDto> {
    if (!isbn) {
      return this.summarize(
        { title, author, description, publisher },
        null,
        userId,
      );
    }

    const saved = await this.getSavedSummary(isbn);
    if (saved) {
      return {
        summary: saved.summary,
        keyPoints: saved.keyPoints,
        targetAudience: saved.targetAudience,
        keywords: saved.keywords,
      };
    }

    // 공유 저장본의 정체성은 요청 본문이 아니라 DB 서지
    const book = await this.bookService.resolveBook(isbn);
    return this.summarize(
      {
        title: book.title,
        author: book.author,
        description: book.description || undefined,
        publisher: book.publisher || undefined,
      },
      book.isbn,
      userId,
    );
  }

  /**
   * 모델로 요약을 생성하고 로그를 남깁니다. `isbn`이 있으면 결과를 그 ISBN의 저장본으로 캐싱합니다.
   */
  private async summarize(
    source: SummarySource,
    isbn: string | null,
    userId?: string | number,
  ): Promise<BookSummaryResponseDto> {
    const { title, author, description, publisher } = source;
    const startTime = Date.now();
    const parsedUserId =
      userId !== undefined && userId !== null && !isNaN(Number(userId))
        ? Number(userId)
        : null;

    try {
      const prompt = getPromptText(title, author, description, publisher);

      const bookSummarySchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          summary: {
            type: SchemaType.STRING,
            description:
              '도서의 구체적 서사와 핵심 갈등을 담은 공백 포함 250~350자 내외의 1개 완성형 문단',
          },
          keyPoints: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '핵심 인사이트 리스트 3개',
          },
          targetAudience: {
            type: SchemaType.STRING,
            description: '추천하는 독자의 구체적 상황이나 고민',
          },
          keywords: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '책과 연관된 태그(키워드) 목록 5개',
          },
        },
        required: ['summary', 'keyPoints', 'targetAudience', 'keywords'],
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: bookSummarySchema,
          temperature: 0.2,
        },
      });
      const latencyMs = Date.now() - startTime;
      const response = result.response;
      const text = response.text();
      const usageMetadata = response.usageMetadata;

      let parsedSummary: BookSummaryResponseDto;
      try {
        parsedSummary = JSON.parse(text) as BookSummaryResponseDto;
      } catch (e) {
        this.logger.warn('JSON 파싱 실패, 원본 텍스트 반환', e);
        parsedSummary = { summary: text };
      }

      if (parsedSummary.keywords) {
        parsedSummary.keywords = parsedSummary.keywords.map((k) =>
          k.startsWith('#') ? k.substring(1) : k,
        );
      }

      // AI 로그 저장 (성공)
      try {
        await this.aiRequestLogRepository.save({
          userId: parsedUserId,
          feature: 'BOOK_SUMMARY',
          model: MODEL_NAME,
          promptTokens: usageMetadata?.promptTokenCount ?? null,
          completionTokens: usageMetadata?.candidatesTokenCount ?? null,
          totalTokens: usageMetadata?.totalTokenCount ?? null,
          latencyMs,
          requestPayload: {
            title,
            author,
            description: description ?? null,
            isbn: isbn ?? null,
            publisher: publisher ?? null,
          },
          responsePayload: parsedSummary as unknown as Record<string, unknown>,
          status: 'SUCCESS',
        });
      } catch (logErr) {
        this.logger.error('Failed to save AI log for BOOK_SUMMARY:', logErr);
      }

      // 생성 성공 시 ISBN 저장본으로 캐싱
      if (isbn && parsedSummary.summary) {
        try {
          const summaryEntity = this.aiBookSummaryRepository.create({
            isbn,
            summary: parsedSummary.summary,
            keyPoints: parsedSummary.keyPoints || [],
            targetAudience: parsedSummary.targetAudience || '',
            keywords: parsedSummary.keywords || [],
          });

          await this.aiBookSummaryRepository.save(summaryEntity);
        } catch (dbError) {
          this.logger.error('AI 요약 DB 저장에 실패했습니다:', dbError);
        }
      }

      return parsedSummary;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      try {
        await this.aiRequestLogRepository.save({
          userId: parsedUserId,
          feature: 'BOOK_SUMMARY',
          model: MODEL_NAME,
          latencyMs,
          requestPayload: {
            title,
            author,
            description: description ?? null,
            isbn: isbn ?? null,
            publisher: publisher ?? null,
          },
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      } catch (logErr) {
        this.logger.error(
          'Failed to save AI error log for BOOK_SUMMARY:',
          logErr,
        );
      }

      this.logger.error('Gemini API 호출에 실패했습니다:', error);

      // 도서 설명글이 있는 경우 간단한 요약 대체 생성 시도 (Graceful Fallback)
      if (description && description.trim().length > 30) {
        const fallbackSummary: BookSummaryResponseDto = {
          summary: `${author} 저자의 도서입니다. ${description.slice(0, 200)}...`,
          keyPoints: [
            `${author} 작가의 대표 저작`,
            '도서 소개글 기반 자동 생성',
            '상세 본문 및 서평 참고 권장',
          ],
          targetAudience: '해당 분야 및 저자의 작품에 관심이 있는 독자',
          keywords: [title, author, publisher || '도서'].filter(Boolean),
        };
        return fallbackSummary;
      }

      throw new BusinessException(
        'EXTERNAL_API_ERROR',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

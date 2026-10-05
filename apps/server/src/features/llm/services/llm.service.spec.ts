import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { BookService } from '@/features/book/services/book.service';
import { BusinessException } from '@/shared/exceptions';

import { AiBookSummary } from '../entities/ai-book-summary.entity';
import { AiRequestLog } from '../entities/ai-request-log.entity';
import { LlmService } from './llm.service';

const canonicalBook = {
  isbn: '1234567890',
  title: '데미안',
  author: '헤르만 헤세',
  description:
    '싱클레어가 두 세계 사이에서 방황하다 자기 자신에게 이르는 길을 그린 헤세의 성장소설',
  publisher: '민음사',
};

const mockGeneratedModel = (summary = 'generated summary') => ({
  generateContent: jest.fn().mockResolvedValue({
    response: {
      text: () =>
        JSON.stringify({
          summary,
          keyPoints: ['point 1'],
          targetAudience: 'audience',
          keywords: ['#tag'],
        }),
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
    },
  }),
});

type GenerateRequest = { contents: { parts: { text: string }[] }[] };

const promptOf = (model: { generateContent: jest.Mock }): string => {
  const [request] = model.generateContent.mock.calls[0] as [GenerateRequest];
  return request.contents[0].parts[0].text;
};

describe('LlmService', () => {
  let service: LlmService;
  let aiBookSummaryRepository: any;
  let aiRequestLogRepository: any;
  let bookService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
        {
          provide: getRepositoryToken(AiRequestLog),
          useValue: {
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(AiBookSummary),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(
              (val: Record<string, any>): AiBookSummary => val as AiBookSummary,
            ),
            save: jest.fn(),
          },
        },
        {
          provide: BookService,
          useValue: {
            resolveBook: jest.fn().mockResolvedValue(canonicalBook),
          },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    aiRequestLogRepository = module.get(getRepositoryToken(AiRequestLog));
    aiBookSummaryRepository = module.get(getRepositoryToken(AiBookSummary));
    bookService = module.get(BookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSavedSummary', () => {
    it('should query repository by isbn', async () => {
      const mockSummary = { isbn: '1234567890', summary: 'test' };
      aiBookSummaryRepository.findOneBy.mockResolvedValue(mockSummary);

      const result = await service.getSavedSummary('1234567890');

      expect(aiBookSummaryRepository.findOneBy).toHaveBeenCalledWith({
        isbn: '1234567890',
      });
      expect(result).toEqual(mockSummary);
    });
  });

  describe('generateBookSummary', () => {
    it('should return cached summary if exists', async () => {
      const mockSaved = {
        isbn: '1234567890',
        summary: 'cached summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      };
      aiBookSummaryRepository.findOneBy.mockResolvedValue(mockSaved);

      const result = await service.generateBookSummary(
        'Title',
        'Author',
        'Desc',
        '1234567890',
      );

      expect(aiBookSummaryRepository.findOneBy).toHaveBeenCalledWith({
        isbn: '1234567890',
      });
      expect(result).toEqual({
        summary: 'cached summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      });
    });

    it('should generate from canonical book and save to DB and save log if not cached', async () => {
      aiBookSummaryRepository.findOneBy.mockResolvedValue(null);
      const mockModel = mockGeneratedModel();
      (service as any).model = mockModel;

      const result = await service.generateBookSummary(
        'Title',
        'Author',
        'Desc',
        '1234567890',
        'Publisher',
        1,
      );

      expect(bookService.resolveBook).toHaveBeenCalledWith('1234567890');
      expect(aiBookSummaryRepository.create).toHaveBeenCalledWith({
        isbn: '1234567890',
        summary: 'generated summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      });
      expect(aiBookSummaryRepository.save).toHaveBeenCalled();
      expect(aiRequestLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          feature: 'BOOK_SUMMARY',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          status: 'SUCCESS',
          requestPayload: expect.objectContaining({
            title: canonicalBook.title,
            isbn: '1234567890',
          }),
        }),
      );
      expect(result).toEqual({
        summary: 'generated summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      });
    });

    it('ignores another book info sent with an ISBN and summarizes the ISBN book', async () => {
      aiBookSummaryRepository.findOneBy.mockResolvedValue(null);
      const mockModel = mockGeneratedModel();
      (service as any).model = mockModel;

      await service.generateBookSummary(
        '다른 책 B',
        '다른 저자 B',
        '다른 책 B의 소개',
        '1234567890',
        '다른 출판사 B',
        1,
      );

      const prompt = promptOf(mockModel);
      expect(prompt).toContain(canonicalBook.title);
      expect(prompt).toContain(canonicalBook.author);
      expect(prompt).toContain(canonicalBook.description);
      expect(prompt).toContain(canonicalBook.publisher);
      expect(prompt).not.toContain('다른 책 B');
      expect(prompt).not.toContain('다른 저자 B');
      expect(prompt).not.toContain('다른 출판사 B');
      expect(aiBookSummaryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isbn: '1234567890' }),
      );
    });

    it('rejects an ISBN missing from the catalog before calling the model', async () => {
      aiBookSummaryRepository.findOneBy.mockResolvedValue(null);
      const notFound = new BusinessException(
        'BOOK_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
      bookService.resolveBook.mockRejectedValue(notFound);
      const mockModel = mockGeneratedModel();
      (service as any).model = mockModel;

      await expect(
        service.generateBookSummary('Title', 'Author', 'Desc', '9999999999'),
      ).rejects.toBe(notFound);

      expect(mockModel.generateContent).not.toHaveBeenCalled();
      expect(aiBookSummaryRepository.save).not.toHaveBeenCalled();
      expect(aiRequestLogRepository.save).not.toHaveBeenCalled();
    });

    it('generates from request text without saving when ISBN is absent', async () => {
      const mockModel = mockGeneratedModel();
      (service as any).model = mockModel;

      const result = await service.generateBookSummary(
        'Title',
        'Author',
        'Desc',
      );

      expect(promptOf(mockModel)).toContain('Title');
      expect(aiBookSummaryRepository.findOneBy).not.toHaveBeenCalled();
      expect(bookService.resolveBook).not.toHaveBeenCalled();
      expect(aiBookSummaryRepository.save).not.toHaveBeenCalled();
      expect(result.summary).toBe('generated summary');
    });

    it('builds the fallback from the canonical description and does not save it', async () => {
      aiBookSummaryRepository.findOneBy.mockResolvedValue(null);
      (service as any).model = {
        generateContent: jest.fn().mockRejectedValue(new Error('down')),
      };

      const result = await service.generateBookSummary(
        '다른 책 B',
        '다른 저자 B',
        '다른 책 B의 소개글은 서른 자를 넘도록 충분히 길게 씁니다',
        '1234567890',
      );

      expect(result.summary).toContain(canonicalBook.description);
      expect(result.summary).not.toContain('다른 책 B');
      expect(aiBookSummaryRepository.save).not.toHaveBeenCalled();
      expect(aiRequestLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ERROR' }),
      );
    });
  });
});

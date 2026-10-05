import {
  MAX_COMMENT_LENGTH,
  MAX_MEMO_LENGTH,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SALE_CONTENT_MAX_LENGTH,
  SALE_CONTENT_MIN_LENGTH,
  SALE_TITLE_MAX_LENGTH,
  SALE_TITLE_MIN_LENGTH,
  TRADE_REVIEW_CONTENT_MAX_LENGTH,
  TradeReviewTag,
  USER_NAME_MAX_LENGTH,
} from '@bookjeok/core';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from '@/features/auth/dtos/register.dto';
import { CreateCommentDto } from '@/features/comment/dtos/create-comment.dto';
import { UpdateCommentDto } from '@/features/comment/dtos/update-comment.dto';
import { CommentTargetType } from '@/features/comment/entities/comment.entity';
import { CreateReadingLogDto } from '@/features/reading-log/dtos/create-reading-log.dto';
import { UpdateReadingLogDto } from '@/features/reading-log/dtos/update-reading-log.dto';
import { CreateTradeReviewDto } from '@/features/trade/dtos/create-trade-review.dto';
import { UpdateTradeReviewDto } from '@/features/trade/dtos/update-trade-review.dto';
import { CreateBookSaleDto } from '@/features/used-book-sale/dtos/create-book-sale.dto';

const failedFields = async <T extends object>(
  cls: ClassConstructor<T>,
  plain: Record<string, unknown>,
): Promise<string[]> =>
  (await validate(plainToInstance(cls, plain))).map((e) => e.property);

const text = (length: number) => 'a'.repeat(length);

const validPassword = (length: number) =>
  `Aa1!${'b'.repeat(Math.max(0, length - 4))}`;

const register = (overrides: Record<string, unknown>) => ({
  email: 'user@example.com',
  password: validPassword(PASSWORD_MIN_LENGTH),
  nickname: '북적이',
  name: '홍길동',
  ...overrides,
});

const sale = (overrides: Record<string, unknown>) => ({
  title: text(SALE_TITLE_MIN_LENGTH),
  price: 1000,
  city: '서울',
  district: '마포구',
  latitude: 37.5,
  longitude: 127,
  content: text(SALE_CONTENT_MIN_LENGTH),
  imageUrls: ['https://example.com/a.jpg'],
  isbn: '9788937460777',
  placeName: '합정역',
  ...overrides,
});

describe('공유 입력 제한값', () => {
  it('웹과 맞춰 온 값을 유지한다', () => {
    expect({
      PASSWORD_MIN_LENGTH,
      PASSWORD_MAX_LENGTH,
      NICKNAME_MIN_LENGTH,
      NICKNAME_MAX_LENGTH,
      USER_NAME_MAX_LENGTH,
      SALE_TITLE_MIN_LENGTH,
      SALE_TITLE_MAX_LENGTH,
      SALE_CONTENT_MIN_LENGTH,
      SALE_CONTENT_MAX_LENGTH,
      MAX_COMMENT_LENGTH,
      MAX_MEMO_LENGTH,
      TRADE_REVIEW_CONTENT_MAX_LENGTH,
    }).toEqual({
      PASSWORD_MIN_LENGTH: 8,
      PASSWORD_MAX_LENGTH: 20,
      NICKNAME_MIN_LENGTH: 2,
      NICKNAME_MAX_LENGTH: 20,
      USER_NAME_MAX_LENGTH: 50,
      SALE_TITLE_MIN_LENGTH: 5,
      SALE_TITLE_MAX_LENGTH: 50,
      SALE_CONTENT_MIN_LENGTH: 10,
      SALE_CONTENT_MAX_LENGTH: 1000,
      MAX_COMMENT_LENGTH: 1000,
      MAX_MEMO_LENGTH: 50,
      TRADE_REVIEW_CONTENT_MAX_LENGTH: 500,
    });
  });

  it('회원가입: 비밀번호·닉네임·이름 경계', async () => {
    expect(await failedFields(RegisterDto, register({}))).toEqual([]);
    expect(
      await failedFields(
        RegisterDto,
        register({ password: validPassword(PASSWORD_MAX_LENGTH) }),
      ),
    ).toEqual([]);
    expect(
      await failedFields(
        RegisterDto,
        register({ password: validPassword(PASSWORD_MAX_LENGTH + 1) }),
      ),
    ).toEqual(['password']);
    expect(
      await failedFields(
        RegisterDto,
        register({ password: validPassword(PASSWORD_MIN_LENGTH - 1) }),
      ),
    ).toEqual(['password']);
    expect(
      await failedFields(RegisterDto, register({ password: 'abcdefgh1' })),
    ).toEqual(['password']);
    expect(
      await failedFields(
        RegisterDto,
        register({ nickname: text(NICKNAME_MAX_LENGTH + 1) }),
      ),
    ).toEqual(['nickname']);
    expect(
      await failedFields(
        RegisterDto,
        register({ name: text(USER_NAME_MAX_LENGTH + 1) }),
      ),
    ).toEqual(['name']);
  });

  it('회원가입 닉네임은 프로필 수정과 같은 규칙을 쓴다', async () => {
    for (const nickname of [
      text(NICKNAME_MAX_LENGTH),
      '행복한 판다',
      'book_lover',
    ]) {
      expect(await failedFields(RegisterDto, register({ nickname }))).toEqual(
        [],
      );
    }
    for (const nickname of ['두  칸', '느낌표!', 'a']) {
      expect(await failedFields(RegisterDto, register({ nickname }))).toEqual([
        'nickname',
      ]);
    }

    const dto = plainToInstance(RegisterDto, register({ nickname: ' 판다 ' }));
    expect(await validate(dto)).toEqual([]);
    expect(dto.nickname).toBe('판다');
  });

  it('판매글: 제목·본문 경계', async () => {
    expect(
      await failedFields(
        CreateBookSaleDto,
        sale({
          title: text(SALE_TITLE_MAX_LENGTH),
          content: text(SALE_CONTENT_MAX_LENGTH),
        }),
      ),
    ).toEqual([]);
    expect(
      await failedFields(
        CreateBookSaleDto,
        sale({ title: text(SALE_TITLE_MIN_LENGTH - 1) }),
      ),
    ).toEqual(['title']);
    expect(
      await failedFields(
        CreateBookSaleDto,
        sale({ content: text(SALE_CONTENT_MAX_LENGTH + 1) }),
      ),
    ).toEqual(['content']);
  });

  it('댓글·독서 메모·거래 후기 최대 길이', async () => {
    const comment = {
      targetType: CommentTargetType.BOOK,
      targetId: '9788937460777',
    };
    expect(
      await failedFields(CreateCommentDto, {
        ...comment,
        content: text(MAX_COMMENT_LENGTH),
      }),
    ).toEqual([]);
    expect(
      await failedFields(CreateCommentDto, {
        ...comment,
        content: text(MAX_COMMENT_LENGTH + 1),
      }),
    ).toEqual(['content']);
    expect(
      await failedFields(UpdateCommentDto, {
        content: text(MAX_COMMENT_LENGTH + 1),
      }),
    ).toEqual(['content']);

    const log = { isbn: '9788937460777', date: '2026-10-05' };
    expect(
      await failedFields(CreateReadingLogDto, {
        ...log,
        memo: text(MAX_MEMO_LENGTH),
      }),
    ).toEqual([]);
    expect(
      await failedFields(CreateReadingLogDto, {
        ...log,
        memo: text(MAX_MEMO_LENGTH + 1),
      }),
    ).toEqual(['memo']);
    expect(
      await failedFields(UpdateReadingLogDto, {
        memo: text(MAX_MEMO_LENGTH + 1),
      }),
    ).toContain('memo');

    const review = { completionId: 1, tags: [TradeReviewTag.KIND_MANNER] };
    expect(
      await failedFields(CreateTradeReviewDto, {
        ...review,
        content: text(TRADE_REVIEW_CONTENT_MAX_LENGTH),
      }),
    ).toEqual([]);
    expect(
      await failedFields(CreateTradeReviewDto, {
        ...review,
        content: text(TRADE_REVIEW_CONTENT_MAX_LENGTH + 1),
      }),
    ).toEqual(['content']);
    expect(
      await failedFields(UpdateTradeReviewDto, {
        content: text(TRADE_REVIEW_CONTENT_MAX_LENGTH + 1),
      }),
    ).toContain('content');
  });
});

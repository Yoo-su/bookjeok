import { HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Repository } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';
import { Review } from '@/features/review/entities/review.entity';
import { ReviewService } from '@/features/review/services/review.service';
import { BusinessException } from '@/shared/exceptions';
import { adjustCounter } from '@/shared/utils/adjust-counter';

import { Comment, CommentTargetType } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { CommentService } from './comment.service';

jest.mock('@/shared/utils/adjust-counter');

jest.mock('@nestjs-cls/transactional', () => {
  const actual = jest.requireActual<Record<string, unknown>>(
    '@nestjs-cls/transactional',
  );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: unknown,
        _propertyKey: string,
        descriptor: PropertyDescriptor,
      ) =>
        descriptor,
  };
});

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: jest.Mocked<Partial<Repository<Comment>>>;
  let commentLikeRepository: jest.Mocked<Partial<Repository<CommentLike>>>;
  let reviewService: jest.Mocked<Partial<ReviewService>>;
  let bookService: jest.Mocked<Partial<BookService>>;
  let eventEmitter: jest.Mocked<Partial<EventEmitter2>>;
  let mockManager: any;
  let mockTxHost: { tx: any };

  beforeEach(async () => {
    jest.mocked(adjustCounter).mockClear();
    commentRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    commentLikeRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    reviewService = {
      findReviewById: jest.fn(),
      findReviewsByIds: jest.fn().mockResolvedValue([]),
    };

    bookService = {
      resolveBook: jest.fn(),
      findBookByIsbn: jest.fn(),
      findBooksByIsbns: jest.fn().mockResolvedValue([]),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const mockQb = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
    };

    mockManager = {
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation(
          (_entity: unknown, data: Record<string, unknown>) => data,
        ),
      save: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };

    mockTxHost = {
      tx: mockManager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepository,
        },
        {
          provide: getRepositoryToken(CommentLike),
          useValue: commentLikeRepository,
        },
        {
          provide: ReviewService,
          useValue: reviewService,
        },
        {
          provide: BookService,
          useValue: bookService,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
        {
          provide: TransactionHost,
          useValue: mockTxHost,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  describe('getComments', () => {
    const comment = {
      id: 1,
      content: '댓글',
      targetType: CommentTargetType.REVIEW,
      targetId: '42',
      userId: 2,
      likeCount: 1,
    } as Comment;

    const setCommentsResult = () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[comment], 1]),
      };
      (commentRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb,
      );
    };

    it('로그인 사용자가 좋아요한 댓글에는 isLiked를 true로 반환한다', async () => {
      setCommentsResult();
      (commentLikeRepository.find as jest.Mock).mockResolvedValue([
        { commentId: comment.id },
      ]);

      const result = await service.getComments(
        {
          targetType: CommentTargetType.REVIEW,
          targetId: '42',
          page: 1,
          limit: 10,
        },
        10,
      );

      expect(result.data[0].isLiked).toBe(true);
    });

    it('익명 사용자의 댓글 목록에는 isLiked를 false로 반환한다', async () => {
      setCommentsResult();

      const result = await service.getComments({
        targetType: CommentTargetType.REVIEW,
        targetId: '42',
        page: 1,
        limit: 10,
      });

      expect(result.data[0].isLiked).toBe(false);
    });
  });

  describe('getMyComments', () => {
    it('should batch query reviews and books to avoid N+1 queries', async () => {
      const mockComments = [
        {
          id: 1,
          content: '첫 번째 댓글',
          targetType: CommentTargetType.REVIEW,
          targetId: '10',
          likeCount: 0,
          createdAt: new Date('2026-08-01'),
        },
        {
          id: 2,
          content: '두 번째 댓글',
          targetType: CommentTargetType.BOOK,
          targetId: '9788937460000',
          likeCount: 2,
          createdAt: new Date('2026-08-02'),
        },
      ] as Comment[];

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockComments, 2]),
      };

      (commentRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb,
      );

      (reviewService.findReviewsByIds as jest.Mock).mockResolvedValue([
        {
          id: 10,
          title: '죄와 벌 서평',
          book: { title: '죄와 벌' },
        },
      ]);

      (bookService.findBooksByIsbns as jest.Mock).mockResolvedValue([
        {
          isbn: '9788937460000',
          title: '어린 왕자',
        },
      ]);

      const result = await service.getMyComments(1, 1, 10);

      expect(reviewService.findReviewsByIds).toHaveBeenCalledWith([10]);
      expect(bookService.findBooksByIsbns).toHaveBeenCalledWith([
        '9788937460000',
      ]);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].targetTitle).toBe('죄와 벌 서평');
      expect(result.data[0].targetSubtitle).toBe('죄와 벌');
      expect(result.data[1].targetTitle).toBe('어린 왕자');
    });
  });

  describe('toggleLike', () => {
    it('좋아요가 없을 때 orIgnore()를 통해 새로 좋아요를 추가하고 likeCount를 증가시켜야 합니다', async () => {
      const comment = { id: 1, userId: 2, likeCount: 0 } as Comment;
      (commentRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(comment) // findCommentOrThrow
        .mockResolvedValueOnce({ ...comment, likeCount: 1 }); // updatedComment

      const result = await service.toggleLike(1, 1);
      expect(result.isLiked).toBe(true);
      expect(adjustCounter).toHaveBeenCalledWith(
        mockManager,
        Comment,
        { id: 1 },
        'likeCount',
        1,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.liked',
        expect.objectContaining({ isLiked: true }),
      );
    });

    it('이미 좋아요가 있을 때 좋아요를 삭제하고 likeCount를 감소시켜야 합니다', async () => {
      const comment = { id: 1, userId: 2, likeCount: 1 } as Comment;
      const existingLike = { id: 99, commentId: 1, userId: 1 };

      (commentRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(comment) // findCommentOrThrow
        .mockResolvedValueOnce({ ...comment, likeCount: 0 }); // updatedComment

      (mockManager.findOne as jest.Mock).mockResolvedValue(existingLike);
      (mockManager.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.toggleLike(1, 1);
      expect(result.isLiked).toBe(false);
      expect(adjustCounter).toHaveBeenCalledWith(
        mockManager,
        Comment,
        { id: 1 },
        'likeCount',
        -1,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.liked',
        expect.objectContaining({ isLiked: false }),
      );
    });
  });
  describe('createComment', () => {
    const saved = { id: 7 } as Comment;

    beforeEach(() => {
      (commentRepository.create as jest.Mock).mockImplementation(
        (data: Partial<Comment>) => data,
      );
      (commentRepository.save as jest.Mock).mockResolvedValue(saved);
      (commentRepository.findOne as jest.Mock).mockResolvedValue({
        ...saved,
        userId: 1,
      });
    });

    it('리뷰 대상이 있으면 정식 리뷰 ID로 저장하고 이벤트를 발행한다', async () => {
      (reviewService.findReviewById as jest.Mock).mockResolvedValue({
        id: 12,
      } as Review);

      await service.createComment(
        {
          content: '좋은 리뷰',
          targetType: CommentTargetType.REVIEW,
          targetId: '012',
        },
        1,
      );

      expect(reviewService.findReviewById).toHaveBeenCalledWith(12);
      expect(commentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ targetId: '12', userId: 1 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.created',
        expect.anything(),
      );
    });

    it('없는 리뷰에는 저장하지 않고 REVIEW_NOT_FOUND를 던진다', async () => {
      (reviewService.findReviewById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createComment(
          {
            content: '댓글',
            targetType: CommentTargetType.REVIEW,
            targetId: '999',
          },
          1,
        ),
      ).rejects.toMatchObject({ errorCode: 'REVIEW_NOT_FOUND' });

      expect(commentRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it.each(['no-such-review', '12abc', '-1', '1.5', ''])(
      '숫자가 아닌 리뷰 ID(%p)는 조회 없이 거부한다',
      async (targetId) => {
        await expect(
          service.createComment(
            { content: '댓글', targetType: CommentTargetType.REVIEW, targetId },
            1,
          ),
        ).rejects.toMatchObject({ errorCode: 'REVIEW_NOT_FOUND' });

        expect(reviewService.findReviewById).not.toHaveBeenCalled();
        expect(commentRepository.save).not.toHaveBeenCalled();
      },
    );

    it('도서 대상은 DB 도서의 ISBN으로 저장한다', async () => {
      (bookService.resolveBook as jest.Mock).mockResolvedValue({
        isbn: '9788937460777',
      });

      await service.createComment(
        {
          content: '댓글',
          targetType: CommentTargetType.BOOK,
          targetId: '9788937460777',
        },
        1,
      );

      expect(bookService.resolveBook).toHaveBeenCalledWith('9788937460777');
      expect(commentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ targetId: '9788937460777' }),
      );
    });

    it('없는 도서에는 저장하지 않는다', async () => {
      const notFound = new BusinessException(
        'BOOK_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
      (bookService.resolveBook as jest.Mock).mockRejectedValue(notFound);

      await expect(
        service.createComment(
          {
            content: '댓글',
            targetType: CommentTargetType.BOOK,
            targetId: '0000000000000',
          },
          1,
        ),
      ).rejects.toBe(notFound);

      expect(commentRepository.save).not.toHaveBeenCalled();
    });
  });
});

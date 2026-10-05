import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Repository } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';
import { CommentEvents } from '@/features/comment/events/comment.events';
import { ReviewService } from '@/features/review/services/review.service';
import { emitDomainEvent } from '@/shared/events/domain-event';
import { BusinessException } from '@/shared/exceptions';
import { adjustCounter } from '@/shared/utils/adjust-counter';
import { clampNumber } from '@/shared/utils/clamp-number';

import { COMMENT_PAGE_SIZE_MAX } from '../constants';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { GetCommentsDto } from '../dtos/get-comments.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';
import { Comment, CommentTargetType } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';

/**
 * 댓글 서비스
 * 댓글 CRUD 및 좋아요 기능을 처리합니다.
 */
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    private readonly reviewService: ReviewService,
    private readonly bookService: BookService,
    private readonly eventEmitter: EventEmitter2,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  /**
   * 댓글 목록을 페이지네이션으로 조회합니다.
   * @param dto 조회 파라미터
   * @param userId 현재 로그인한 사용자 ID (옵션, 좋아요 상태 확인용)
   */
  async getComments(dto: GetCommentsDto, userId?: number) {
    const { targetType, targetId, page = 1, limit = 10, cursorId } = dto;

    // QueryBuilder 생성
    const qb = this.commentRepository.createQueryBuilder('comment');
    qb.leftJoinAndSelect('comment.user', 'user');
    qb.where('comment.targetType = :targetType', { targetType });
    qb.andWhere('comment.targetId = :targetId', { targetId });

    // 커서 기반 페이지네이션을 위해 ID 역순 정렬 사용
    qb.orderBy('comment.id', 'DESC');

    // 커서 기반 페이지네이션
    if (cursorId) {
      qb.andWhere('comment.id < :cursorId', { cursorId });
    } else {
      // 오프셋 기반 (fallback)
      qb.skip((page - 1) * limit);
    }

    qb.take(limit);

    const [comments, total] = await qb.getManyAndCount();

    // 로그인한 사용자의 좋아요 상태 확인
    let likedCommentIds: Set<number> = new Set();
    if (userId && comments.length > 0) {
      const likes = await this.commentLikeRepository.find({
        where: comments.map((c) => ({ commentId: c.id, userId })),
        select: ['commentId'],
      });
      likedCommentIds = new Set(likes.map((l) => l.commentId));
    }

    // isLiked 필드 추가
    const commentsWithLikeStatus = comments.map((comment) => ({
      ...comment,
      isLiked: likedCommentIds.has(comment.id),
    }));

    // 다음 커서 계산
    let nextCursor: number | null = null;
    if (comments.length > 0) {
      nextCursor = comments[comments.length - 1].id;
    }

    // 커서 방식일 때 hasNextPage 계산은 limit만큼 가져왔는지로 판단
    const hasNextPage = comments.length === limit;

    return {
      data: commentsWithLikeStatus,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage,
        nextCursor: nextCursor ?? undefined,
      },
    };
  }

  /**
   * 내가 쓴 댓글 목록을 조회합니다.
   * 대상 정보(도서/리뷰 제목)도 함께 반환합니다.
   * @param userId 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   */
  async getMyComments(
    userId: number,
    page: number = 1,
    limit: number = 10,
    cursorId?: number,
  ) {
    page = clampNumber(page, 1, 1, Number.MAX_SAFE_INTEGER);
    limit = clampNumber(limit, 10, 1, COMMENT_PAGE_SIZE_MAX);

    const qb = this.commentRepository.createQueryBuilder('comment');
    qb.where('comment.userId = :userId', { userId });

    // 커서 기반 페이지네이션을 위해 ID 역순 정렬 사용
    qb.orderBy('comment.id', 'DESC');

    // 커서 기반 페이지네이션
    if (cursorId) {
      qb.andWhere('comment.id < :cursorId', { cursorId });
    } else {
      // 오프셋 기반 (fallback)
      qb.skip((page - 1) * limit);
    }

    qb.take(limit);

    const [comments, total] = await qb.getManyAndCount();

    // 대상 정보 일괄 조회를 위한 ID 집계 (N+1 쿼리 최적화)
    const reviewIds = comments
      .filter((c) => c.targetType === CommentTargetType.REVIEW)
      .map((c) => parseInt(c.targetId, 10))
      .filter((id) => !isNaN(id));

    const isbns = comments
      .filter((c) => c.targetType === CommentTargetType.BOOK)
      .map((c) => c.targetId);

    const [reviews, books] = await Promise.all([
      reviewIds.length > 0
        ? this.reviewService.findReviewsByIds(reviewIds)
        : Promise.resolve([]),
      isbns.length > 0
        ? this.bookService.findBooksByIsbns(isbns)
        : Promise.resolve([]),
    ]);

    const reviewMap = new Map(reviews.map((r) => [r.id, r]));
    const bookMap = new Map(books.map((b) => [b.isbn, b]));

    const commentsWithTargetInfo = comments.map((comment) => {
      let targetTitle: string | null = null;
      let targetSubtitle: string | null = null;

      if (comment.targetType === CommentTargetType.REVIEW) {
        const review = reviewMap.get(parseInt(comment.targetId, 10));
        if (review) {
          targetTitle = review.title;
          targetSubtitle = review.book?.title ?? null;
        }
      } else if (comment.targetType === CommentTargetType.BOOK) {
        const book = bookMap.get(comment.targetId);
        if (book) {
          targetTitle = book.title;
        }
      }

      return {
        id: comment.id,
        content: comment.content,
        targetType: comment.targetType,
        targetId: comment.targetId,
        targetTitle,
        targetSubtitle,
        likeCount: comment.likeCount,
        createdAt: comment.createdAt,
      };
    });

    // 다음 커서 계산
    let nextCursor: number | null = null;
    if (comments.length > 0) {
      nextCursor = comments[comments.length - 1].id;
    }

    // 커서 방식일 때 hasNextPage 계산은 limit만큼 가져왔는지로 판단
    const hasNextPage = comments.length === limit;

    return {
      data: commentsWithTargetInfo,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage,
        nextCursor: nextCursor ?? undefined,
      },
    };
  }

  /**
   * 특정 타겟의 총 댓글 수를 반환합니다. (인기 도서 계산용)
   */
  async getCommentCount(
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<number> {
    return this.commentRepository.count({
      where: { targetType, targetId },
    });
  }

  /**
   * 댓글을 생성합니다.
   */
  async createComment(dto: CreateCommentDto, userId: number) {
    const targetId = await this.resolveTargetId(dto.targetType, dto.targetId);
    const comment = this.commentRepository.create({
      ...dto,
      targetId,
      userId,
    });

    const savedComment = await this.commentRepository.save(comment);

    const result = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    if (result) {
      emitDomainEvent(this.eventEmitter, CommentEvents.created, {
        comment: result,
      });
    }

    return result;
  }

  /**
   * 댓글을 수정합니다. (작성자만 가능)
   */
  async updateComment(id: number, dto: UpdateCommentDto, userId: number) {
    const comment = await this.findCommentOrThrow(id);

    if (comment.userId !== userId) {
      throw new BusinessException('COMMENT_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    await this.commentRepository.update(id, dto);

    return this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  /**
   * 댓글을 삭제합니다. (작성자만 가능)
   */
  async deleteComment(id: number, userId: number) {
    const comment = await this.findCommentOrThrow(id);

    if (comment.userId !== userId) {
      throw new BusinessException('COMMENT_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    await this.commentRepository.delete(id);
  }

  /**
   * 좋아요를 토글합니다.
   * 이미 좋아요한 경우 취소, 아닌 경우 추가합니다.
   */
  async toggleLike(commentId: number, userId: number) {
    const isLiked = await this.persistLikeToggle(commentId, userId);

    // 커밋된 뒤에 읽고 발행한다. 트랜잭션 안에서 하면 롤백된 좋아요에 대한
    // 알림이 남고, 아직 커밋되지 않은 likeCount를 읽어 보낸다.
    const updatedComment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (updatedComment) {
      emitDomainEvent(this.eventEmitter, CommentEvents.liked, {
        comment: updatedComment,
        actorId: userId,
        isLiked,
      });
    }

    return { ...updatedComment, isLiked };
  }

  /**
   * 좋아요 토글의 상태 변경만 트랜잭션 안에서 수행합니다.
   * @returns 좋아요가 추가되었으면 true, 취소되었으면 false
   */
  @Transactional()
  private async persistLikeToggle(
    commentId: number,
    userId: number,
  ): Promise<boolean> {
    await this.findCommentOrThrow(commentId);

    let isLiked = false;
    const manager = this.txHost.tx;

    const existingLike = await manager.findOne(CommentLike, {
      where: { commentId, userId },
    });

    if (existingLike) {
      // 좋아요 취소: 실제로 삭제된 경우에만 likeCount 감소 (중복 감소 방지)
      const deleteResult = await manager.delete(CommentLike, existingLike.id);
      if (deleteResult.affected && deleteResult.affected > 0) {
        await adjustCounter(
          manager,
          Comment,
          { id: commentId },
          'likeCount',
          -1,
        );
      }
      isLiked = false;
    } else {
      // 좋아요 추가: orIgnore()로 중복 충돌 시 SQL 에러 없이 무시 (ON CONFLICT DO NOTHING)
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(CommentLike)
        .values({ commentId, userId })
        .orIgnore()
        .execute();

      // 실제로 새로운 레코드가 삽입된 경우에만 카운트 증가
      if (insertResult.identifiers?.length > 0 && insertResult.identifiers[0]) {
        await adjustCounter(
          manager,
          Comment,
          { id: commentId },
          'likeCount',
          1,
        );
      }
      isLiked = true;
    }

    return isLiked;
  }

  /**
   * 현재 사용자의 좋아요 상태를 확인합니다.
   */
  async getMyLikeStatus(commentId: number, userId: number): Promise<boolean> {
    const like = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });
    return !!like;
  }

  /**
   * 댓글 대상이 존재하는지 확인하고 저장할 정식 targetId를 반환합니다.
   * 대상의 공개 여부는 보지 않습니다(비공개 리뷰 댓글 정책 유지).
   * @throws BOOK_NOT_FOUND, REVIEW_NOT_FOUND
   */
  private async resolveTargetId(
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<string> {
    switch (targetType) {
      case CommentTargetType.BOOK: {
        const book = await this.bookService.resolveBook(targetId);
        return book.isbn;
      }
      case CommentTargetType.REVIEW: {
        // parseInt는 '12abc'도 12로 읽으므로 숫자 문자열만 허용
        const reviewId = /^\d+$/.test(targetId) ? Number(targetId) : NaN;
        const review = Number.isSafeInteger(reviewId)
          ? await this.reviewService.findReviewById(reviewId)
          : null;
        if (!review) {
          throw new BusinessException('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return String(review.id);
      }
    }
  }

  /**
   * 댓글 ID로 조회하고, 없으면 예외를 던집니다.
   */
  private async findCommentOrThrow(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new BusinessException('COMMENT_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return comment;
  }
}

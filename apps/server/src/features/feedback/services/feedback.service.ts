import {
  AdminFeedback,
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_LIST_LIMIT,
  FeedbackListResponse,
  FeedbackType,
  MyFeedback,
} from '@bookjeok/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';

import { FeedbackEvents } from '@/features/feedback/events/feedback.events';
import { emitDomainEvent } from '@/shared/events/domain-event';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { CreateFeedbackDto } from '../dtos/create-feedback.dto';
import { GetAdminFeedbackQueryDto } from '../dtos/get-admin-feedback-query.dto';
import { UpdateFeedbackDto } from '../dtos/update-feedback.dto';
import { Feedback, FeedbackDetails } from '../entities/feedback.entity';

const USER_AGENT_MAX_LENGTH = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 빈 문자열은 지우기로 본다 */
const toNullable = (value: string) => value.trim() || null;

/**
 * 사용자 문의·제보 접수
 */
@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 문의를 저장하고 운영자 알림 이벤트를 발행합니다.
   * @param userId 작성자
   * @param dto 문의 내용
   * @param userAgent 요청 헤더의 User-Agent
   */
  async create(
    userId: number,
    dto: CreateFeedbackDto,
    userAgent?: string,
  ): Promise<{ id: number }> {
    const isBookRequest = dto.type === FeedbackType.BOOK_REQUEST;
    if (isBookRequest && !dto.bookTitle) {
      throw new BusinessException(
        'FEEDBACK_BOOK_TITLE_REQUIRED',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!isBookRequest && !dto.content) {
      throw new BusinessException(
        'FEEDBACK_CONTENT_REQUIRED',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 세고 저장하는 사이 동시 요청은 막지 않는다. 폭주만 막으면 된다
    const recentCount = await this.feedbackRepository.count({
      where: { userId, createdAt: MoreThan(new Date(Date.now() - DAY_MS)) },
    });
    if (recentCount >= FEEDBACK_DAILY_LIMIT) {
      throw new BusinessException(
        'FEEDBACK_DAILY_LIMIT_EXCEEDED',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const details: FeedbackDetails = {
      ...(isBookRequest && {
        bookTitle: dto.bookTitle,
        bookAuthor: dto.bookAuthor || undefined,
        bookPublisher: dto.bookPublisher || undefined,
      }),
      pagePath: dto.pagePath,
      userAgent: userAgent?.slice(0, USER_AGENT_MAX_LENGTH),
    };

    const saved = await this.feedbackRepository.save(
      this.feedbackRepository.create({
        userId,
        type: dto.type,
        content: dto.content ?? '',
        details,
      }),
    );

    emitDomainEvent(this.eventEmitter, FeedbackEvents.created, {
      feedbackId: saved.id,
    });

    return { id: saved.id };
  }

  /**
   * 내가 보낸 문의 (최신순, id 커서)
   */
  async findMine(
    userId: number,
    cursor?: number,
  ): Promise<FeedbackListResponse<MyFeedback>> {
    const { items, nextCursor } = await this.findPage({ userId }, cursor);
    return { items: items.map((f) => this.toMyFeedback(f)), nextCursor };
  }

  /**
   * 운영자 목록. 상태·종류로 거른다
   */
  async findForAdmin(
    query: GetAdminFeedbackQueryDto,
  ): Promise<FeedbackListResponse<AdminFeedback>> {
    const { items, nextCursor } = await this.findPage(
      {
        ...(query.status && { status: query.status }),
        ...(query.type && { type: query.type }),
      },
      query.cursor,
      true,
    );
    return { items: items.map((f) => this.toAdminFeedback(f)), nextCursor };
  }

  /**
   * 운영자 처리. 답변을 새로 쓰거나 바꾸면 작성자 알림 이벤트를 발행합니다.
   */
  async updateByAdmin(
    id: number,
    dto: UpdateFeedbackDto,
  ): Promise<AdminFeedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!feedback) {
      throw new BusinessException('FEEDBACK_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    let replied = false;
    if (dto.reply !== undefined) {
      const reply = toNullable(dto.reply);
      replied = reply !== null && reply !== feedback.reply;
      if (reply !== feedback.reply) {
        feedback.reply = reply;
        feedback.repliedAt = reply === null ? null : new Date();
      }
    }
    if (dto.adminNote !== undefined) {
      feedback.adminNote = toNullable(dto.adminNote);
    }
    if (dto.status) {
      feedback.status = dto.status;
    }

    const saved = await this.feedbackRepository.save(feedback);

    if (replied && saved.userId !== null) {
      emitDomainEvent(this.eventEmitter, FeedbackEvents.replied, {
        feedbackId: saved.id,
        userId: saved.userId,
        type: saved.type,
        bookTitle: saved.details?.bookTitle,
      });
    }

    return this.toAdminFeedback(saved);
  }

  private async findPage(
    where: FindOptionsWhere<Feedback>,
    cursor?: number,
    withUser = false,
  ) {
    const rows = await this.feedbackRepository.find({
      where: { ...where, ...(cursor && { id: LessThan(cursor) }) },
      relations: withUser ? { user: true } : undefined,
      order: { id: 'DESC' },
      take: FEEDBACK_LIST_LIMIT + 1,
    });
    const hasNext = rows.length > FEEDBACK_LIST_LIMIT;
    const items = hasNext ? rows.slice(0, FEEDBACK_LIST_LIMIT) : rows;
    return {
      items,
      nextCursor: hasNext ? items[items.length - 1].id : null,
    };
  }

  private toMyFeedback(feedback: Feedback): MyFeedback {
    const { bookTitle, bookAuthor, bookPublisher } = feedback.details ?? {};
    return {
      id: feedback.id,
      type: feedback.type,
      status: feedback.status,
      content: feedback.content,
      book: bookTitle
        ? {
            title: bookTitle,
            author: bookAuthor ?? null,
            publisher: bookPublisher ?? null,
          }
        : null,
      reply: feedback.reply,
      repliedAt: feedback.repliedAt?.toISOString() ?? null,
      createdAt: feedback.createdAt.toISOString(),
    };
  }

  // 엔티티를 그대로 내보내면 작성자 이메일 등이 섞이므로 필드를 골라 담는다
  private toAdminFeedback(feedback: Feedback): AdminFeedback {
    return {
      ...this.toMyFeedback(feedback),
      user: feedback.user
        ? {
            id: feedback.user.id,
            nickname: feedback.user.nickname,
            handle: feedback.user.handle,
          }
        : null,
      pagePath: feedback.details?.pagePath ?? null,
      userAgent: feedback.details?.userAgent ?? null,
      adminNote: feedback.adminNote,
      updatedAt: feedback.updatedAt.toISOString(),
    };
  }
}

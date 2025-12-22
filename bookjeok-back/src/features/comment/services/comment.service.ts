import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comment, CommentTargetType } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { GetCommentsDto } from '../dto/get-comments.dto';

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
  ) {}

  /**
   * 댓글 목록을 페이지네이션으로 조회합니다.
   */
  async getComments(dto: GetCommentsDto) {
    const { targetType, targetId, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { targetType, targetId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
    const comment = this.commentRepository.create({
      ...dto,
      userId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // 유저 정보 포함해서 반환
    return this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  /**
   * 댓글을 수정합니다. (작성자만 가능)
   */
  async updateComment(id: number, dto: UpdateCommentDto, userId: number) {
    const comment = await this.findCommentOrThrow(id);

    if (comment.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 댓글만 수정할 수 있습니다.');
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
      throw new ForbiddenException('본인이 작성한 댓글만 삭제할 수 있습니다.');
    }

    await this.commentRepository.delete(id);
    return { success: true };
  }

  /**
   * 좋아요를 토글합니다.
   * 이미 좋아요한 경우 취소, 아닌 경우 추가합니다.
   */
  async toggleLike(commentId: number, userId: number) {
    await this.findCommentOrThrow(commentId);

    const existingLike = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    let isLiked: boolean;

    if (existingLike) {
      // 좋아요 취소
      await this.commentLikeRepository.delete(existingLike.id);
      await this.commentRepository.decrement({ id: commentId }, 'likeCount', 1);
      isLiked = false;
    } else {
      // 좋아요 추가
      const like = this.commentLikeRepository.create({ commentId, userId });
      await this.commentLikeRepository.save(like);
      await this.commentRepository.increment({ id: commentId }, 'likeCount', 1);
      isLiked = true;
    }

    // 업데이트된 댓글 반환
    const updatedComment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    return {
      ...updatedComment,
      isLiked,
    };
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
   * 댓글 ID로 조회하고, 없으면 예외를 던집니다.
   */
  private async findCommentOrThrow(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    return comment;
  }
}

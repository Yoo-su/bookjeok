import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { In, Repository } from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ACTIVE_ORDER_STATUSES } from '@/features/order/constants';
import { Order } from '@/features/order/entities/order.entity';
import { TradeEvents } from '@/features/trade/events/trade.events';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';
import { emitDomainEvent } from '@/shared/events/domain-event';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { REVIEW_EXPIRATION_MS } from '../constants';
import {
  TradeCompletion,
  TradeCompletionMethod,
} from '../entities/trade-completion.entity';
import { TradeReview } from '../entities/trade-review.entity';

@Injectable()
export class TradeCompletionService {
  constructor(
    @InjectRepository(TradeCompletion)
    private readonly tradeCompletionRepository: Repository<TradeCompletion>,
    @InjectRepository(TradeReview)
    private readonly tradeReviewRepository: Repository<TradeReview>,
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 판매자가 특정 구매희망자를 거래 상대로 지정하고 판매글을 예약중으로 바꿉니다.
   * 결제 없이 진행되는 직거래 전용 흐름입니다.
   *
   * 상태 변경은 트랜잭션 안에서, 이벤트 발행은 커밋된 뒤에 합니다. 커밋 전에
   * 발행하면 롤백된 거래에 대한 알림과 채팅 메시지가 남고, 소켓 브로드캐스트를
   * 받은 화면이 아직 커밋되지 않은 판매글을 다시 읽어갑니다.
   */
  async reserveForBuyer(
    saleId: number,
    sellerId: number,
    buyerId: number,
    chatRoomId?: number | null,
  ): Promise<UsedBookSale> {
    const { sale, roomId } = await this.persistReservation(
      saleId,
      sellerId,
      buyerId,
      chatRoomId,
    );

    emitDomainEvent(this.eventEmitter, TradeEvents.reserved, {
      saleId,
      sellerId,
      buyerId,
      chatRoomId: roomId,
    });

    return sale;
  }

  @Transactional()
  private async persistReservation(
    saleId: number,
    sellerId: number,
    buyerId: number,
    chatRoomId?: number | null,
  ): Promise<{ sale: UsedBookSale; roomId: number }> {
    const manager = this.txHost.tx;
    const sale = await this.loadSellerSale(saleId, sellerId);

    if (await this.hasActiveOrder(saleId)) {
      throw new BusinessException(
        'SALE_IN_TRADE_CANNOT_CHANGE_STATUS',
        HttpStatus.CONFLICT,
      );
    }

    if (sale.status === SaleStatus.SOLD) {
      throw new BusinessException('SALE_ALREADY_SOLD', HttpStatus.CONFLICT);
    }

    if (buyerId === sellerId) {
      throw new BusinessException(
        'TRADE_BUYER_CANNOT_BE_SELLER',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (sale.reservedForUserId && sale.reservedForUserId !== buyerId) {
      throw new BusinessException(
        'SALE_ALREADY_RESERVED_FOR_OTHER',
        HttpStatus.CONFLICT,
      );
    }

    // 예약은 "지금부터 이 분과 이야기한다"는 선언이므로, 방에 남아 있는
    // 상대만 지정할 수 있다.
    const roomId = await this.resolveCounterpartyRoom(
      saleId,
      buyerId,
      chatRoomId,
      {
        requireActive: true,
      },
    );

    sale.status = SaleStatus.RESERVED;
    sale.reservedForUserId = buyerId;
    const saved = await manager.save(UsedBookSale, sale);

    return { sale: saved, roomId };
  }

  /**
   * 예약을 취소하고 판매글을 다시 판매중으로 되돌립니다.
   */
  async cancelReservation(
    saleId: number,
    sellerId: number,
  ): Promise<UsedBookSale> {
    const { sale, previousBuyerId } = await this.persistReservationCancel(
      saleId,
      sellerId,
    );

    emitDomainEvent(this.eventEmitter, TradeEvents.reservation_cancelled, {
      saleId,
      sellerId,
      buyerId: previousBuyerId,
    });

    return sale;
  }

  @Transactional()
  private async persistReservationCancel(
    saleId: number,
    sellerId: number,
  ): Promise<{ sale: UsedBookSale; previousBuyerId: number | null }> {
    const manager = this.txHost.tx;
    const sale = await this.loadSellerSale(saleId, sellerId);

    if (await this.hasActiveOrder(saleId)) {
      throw new BusinessException(
        'SALE_IN_TRADE_CANNOT_CHANGE_STATUS',
        HttpStatus.CONFLICT,
      );
    }

    if (sale.status !== SaleStatus.RESERVED) {
      throw new BusinessException('SALE_NOT_RESERVED', HttpStatus.BAD_REQUEST);
    }

    const previousBuyerId = sale.reservedForUserId;

    sale.status = SaleStatus.FOR_SALE;
    sale.reservedForUserId = null;
    const saved = await manager.save(UsedBookSale, sale);

    return { sale: saved, previousBuyerId };
  }

  /**
   * 직거래를 완료 처리합니다.
   *
   * 거래 상대를 넘기면 완료 기록이 남아 양쪽 모두 후기를 쓸 수 있고,
   * 넘기지 않으면(`withoutCounterparty`) 판매글만 판매완료로 바뀝니다.
   * 서비스 밖에서 알게 된 사람과 거래한 경우까지 막지 않기 위한 선택지입니다.
   */
  async completeDirectTrade(
    saleId: number,
    sellerId: number,
    buyerId?: number | null,
    chatRoomId?: number | null,
    withoutCounterparty?: boolean,
  ): Promise<{ sale: UsedBookSale; completion: TradeCompletion | null }> {
    const { sale, completion } = await this.persistDirectCompletion(
      saleId,
      sellerId,
      buyerId,
      chatRoomId,
      withoutCounterparty,
    );

    // 완료 기록은 판매글당 하나뿐이라(UQ_trade_completions_saleId) 이 지점에
    // 도달했다면 방금 만들어진 기록이다. 알림과 채팅 메시지도 한 번만 나간다.
    if (completion) {
      emitDomainEvent(this.eventEmitter, TradeEvents.completed, {
        completionId: completion.id,
        saleId,
        sellerId,
        buyerId: completion.buyerId,
        chatRoomId: completion.chatRoomId,
        method: TradeCompletionMethod.DIRECT,
      });
    }

    // 완료 기록 유무와 무관하게, 이 판매글로 대화하던 다른 방들도 판매가
    // 끝났다는 사실은 알아야 한다. 특히 상대를 지정하지 않고 완료한 경우
    // 예약 안내만 받고 방치되는 구매희망자가 생긴다.
    emitDomainEvent(this.eventEmitter, TradeEvents.sale_sold, {
      saleId,
      sellerId,
      chatRoomId: completion?.chatRoomId ?? null,
    });

    return { sale, completion };
  }

  @Transactional()
  private async persistDirectCompletion(
    saleId: number,
    sellerId: number,
    buyerId?: number | null,
    chatRoomId?: number | null,
    withoutCounterparty?: boolean,
  ): Promise<{ sale: UsedBookSale; completion: TradeCompletion | null }> {
    const manager = this.txHost.tx;
    const sale = await this.loadSellerSale(saleId, sellerId);

    // 결제가 걸린 거래는 시스템이 구매확정 시점에 완료 처리한다.
    if (await this.hasActiveOrder(saleId)) {
      throw new BusinessException(
        'SALE_IN_TRADE_CANNOT_CHANGE_STATUS',
        HttpStatus.CONFLICT,
      );
    }

    // 이미 완료 기록이 있는 판매글은 다시 완료할 수 없다. 허용하면 한 거래를
    // 여러 건으로 부풀리거나(다른 상대로 재완료) 같은 거래가 중복 집계된다.
    const completedAlready = await manager.findOne(TradeCompletion, {
      where: { saleId },
    });
    if (completedAlready) {
      throw new BusinessException(
        'SALE_ALREADY_COMPLETED',
        HttpStatus.CONFLICT,
      );
    }

    const counterpartyId = withoutCounterparty
      ? null
      : (buyerId ?? sale.reservedForUserId);

    let completion: TradeCompletion | null = null;

    if (counterpartyId) {
      if (counterpartyId === sellerId) {
        throw new BusinessException(
          'TRADE_BUYER_CANNOT_BE_SELLER',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 완료 시점엔 상대가 이미 채팅방을 나갔을 수 있다. 거래 자체는 있었을
      // 수 있으므로 나간 것만으로 막지는 않되, 이 판매글로 대화한 적은
      // 있어야 한다.
      const roomId = await this.resolveCounterpartyRoom(
        saleId,
        counterpartyId,
        chatRoomId,
        { requireActive: false },
      );

      completion = await manager.save(
        TradeCompletion,
        manager.create(TradeCompletion, {
          saleId,
          sellerId,
          buyerId: counterpartyId,
          chatRoomId: roomId,
          method: TradeCompletionMethod.DIRECT,
          orderId: null,
          completedAt: new Date(),
        }),
      );
    }

    sale.status = SaleStatus.SOLD;
    sale.reservedForUserId = null;
    const saved = await manager.save(UsedBookSale, sale);

    return { sale: saved, completion };
  }

  /**
   * 에스크로 구매확정 시점에 택배 거래의 완료 기록을 남깁니다.
   *
   * 후기와 신뢰 지표가 결제 여부와 무관하게 같은 경로를 타도록,
   * 결제 거래도 반드시 완료 기록을 하나 남깁니다.
   */
  async recordDeliveryCompletion(params: {
    saleId: number;
    sellerId: number;
    buyerId: number;
    chatRoomId?: number | null;
    orderId: string;
  }): Promise<TradeCompletion> {
    const manager = this.txHost.tx ?? this.tradeCompletionRepository.manager;

    // 판매글당 완료 기록은 하나다(UQ_trade_completions_saleId). orderId로만
    // 멱등 처리하면 같은 판매글의 다른 주문이 들어왔을 때 DB 유니크 위반이
    // 그대로 터진다. 구매확정은 토스 에스크로 확정을 이미 호출한 뒤라,
    // 여기서 나는 500은 "정산은 됐는데 주문은 미확정"으로 남는다.
    const existing = await manager.findOne(TradeCompletion, {
      where: { saleId: params.saleId },
    });
    if (existing) {
      if (existing.orderId === params.orderId) return existing;

      throw new BusinessException(
        'SALE_ALREADY_COMPLETED',
        HttpStatus.CONFLICT,
      );
    }

    return await manager.save(
      TradeCompletion,
      manager.create(TradeCompletion, {
        saleId: params.saleId,
        sellerId: params.sellerId,
        buyerId: params.buyerId,
        chatRoomId: params.chatRoomId ?? null,
        method: TradeCompletionMethod.DELIVERY,
        orderId: params.orderId,
        completedAt: new Date(),
      }),
    );
  }

  /**
   * 내가 사거나 판 거래의 완료 내역.
   *
   * 직거래는 결제 기록이 없어서 주문 목록에 잡히지 않습니다. 채팅방을 나가거나
   * 대화가 묻히면 후기 작성 기한이 조용히 지나가므로, 거래를 한자리에서
   * 되짚고 후기를 남길 수 있는 목록이 필요합니다.
   */
  async findMyCompletions(
    userId: number,
    query: { role?: 'ALL' | 'BUYER' | 'SELLER'; page?: number; limit?: number },
  ): Promise<{
    completions: TradeCompletion[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { role = 'ALL', page = 1, limit = 10 } = query;

    const where =
      role === 'BUYER'
        ? [{ buyerId: userId }]
        : role === 'SELLER'
          ? [{ sellerId: userId }]
          : [{ buyerId: userId }, { sellerId: userId }];

    const [completions, total] =
      await this.tradeCompletionRepository.findAndCount({
        where,
        relations: ['sale', 'sale.book', 'seller', 'buyer'],
        order: { completedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    await this.decorateWithMyReview(completions, userId);

    return { completions, total, page, limit };
  }

  /**
   * 목록에 "내 역할 · 상대 · 내 후기 · 작성 가능 여부"를 붙입니다.
   * 후기는 건별로 조회하지 않고 한 번에 모아 N+1을 피합니다.
   */
  private async decorateWithMyReview(
    completions: TradeCompletion[],
    userId: number,
  ): Promise<void> {
    if (completions.length === 0) return;

    const myReviews = await this.tradeReviewRepository.find({
      where: {
        completionId: In(completions.map((completion) => completion.id)),
        reviewerId: userId,
      },
    });
    const reviewByCompletionId = new Map(
      myReviews.map((review) => [review.completionId, review]),
    );

    for (const completion of completions) {
      const isBuyer = completion.buyerId === userId;

      completion.myRole = isBuyer ? 'BUYER' : 'SELLER';
      completion.counterparty = isBuyer ? completion.seller : completion.buyer;

      const myReview = reviewByCompletionId.get(completion.id) ?? null;
      const deadline = new Date(
        new Date(completion.completedAt).getTime() + REVIEW_EXPIRATION_MS,
      );

      completion.myReview = myReview;
      completion.reviewExpiresAt = deadline;
      completion.canWriteReview = !myReview && deadline.getTime() > Date.now();
    }
  }

  /** 완료 기록 단건 조회 (거래 당사자만) */
  async findForParticipant(
    completionId: number,
    userId: number,
  ): Promise<TradeCompletion> {
    const completion = await this.tradeCompletionRepository.findOne({
      where: { id: completionId },
      relations: ['sale', 'sale.book', 'seller', 'buyer'],
    });

    if (!completion) {
      throw new BusinessException(
        'TRADE_COMPLETION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (completion.sellerId !== userId && completion.buyerId !== userId) {
      throw new BusinessException(
        'TRADE_COMPLETION_FORBIDDEN',
        HttpStatus.FORBIDDEN,
      );
    }

    return completion;
  }

  /** 주문으로 만들어진 완료 기록 (주문 화면의 후기 진입용) */
  async findByOrderId(orderId: string): Promise<TradeCompletion | null> {
    return await this.tradeCompletionRepository.findOne({
      where: { orderId },
    });
  }

  /** 특정 채팅방에서 성사된 완료 기록 (채팅방 배너용) */
  async findByChatRoom(
    chatRoomId: number,
    userId: number,
  ): Promise<TradeCompletion | null> {
    const completion = await this.tradeCompletionRepository.findOne({
      where: { chatRoomId },
      order: { completedAt: 'DESC' },
    });

    if (!completion) return null;
    if (completion.sellerId !== userId && completion.buyerId !== userId) {
      return null;
    }

    return completion;
  }

  /** 완료한 거래 수를 거래 방식별로 집계 (신뢰 지표용) */
  async countCompletionsAsSeller(sellerId: number): Promise<{
    direct: number;
    delivery: number;
    total: number;
  }> {
    const rows = await this.tradeCompletionRepository
      .createQueryBuilder('completion')
      .select('completion.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .where('completion.sellerId = :sellerId', { sellerId })
      .groupBy('completion.method')
      .getRawMany<{ method: TradeCompletionMethod; count: string }>();

    const countOf = (method: TradeCompletionMethod) =>
      Number(rows.find((row) => row.method === method)?.count ?? 0);

    const direct = countOf(TradeCompletionMethod.DIRECT);
    const delivery = countOf(TradeCompletionMethod.DELIVERY);

    return { direct, delivery, total: direct + delivery };
  }

  /**
   * 판매글에 대해 대화한 구매희망자 목록.
   *
   * 마이페이지에서 판매완료로 바꿀 때 "누구와 거래하셨나요?"를 묻기 위한
   * 후보 목록입니다. 채팅방을 나갔거나 탈퇴한 사람은 제외합니다.
   */
  async findTradeCandidates(
    saleId: number,
    sellerId: number,
  ): Promise<Array<{ user: User; chatRoomId: number }>> {
    await this.loadSellerSale(saleId, sellerId);

    const participants = await this.chatParticipantRepository
      .createQueryBuilder('participant')
      .innerJoinAndSelect('participant.user', 'user')
      .innerJoinAndSelect('participant.chatRoom', 'room')
      .innerJoin('room.usedBookSale', 'sale')
      .where('sale.id = :saleId', { saleId })
      .andWhere('participant.isActive = true')
      .andWhere('user.id != :sellerId', { sellerId })
      .andWhere('user.deletedAt IS NULL')
      .orderBy('room.updatedAt', 'DESC')
      .getMany();

    return participants.map((participant) => ({
      user: participant.user,
      chatRoomId: participant.chatRoom.id,
    }));
  }

  private async loadSellerSale(
    saleId: number,
    sellerId: number,
  ): Promise<UsedBookSale> {
    const manager = this.txHost.tx ?? this.usedBookSaleRepository.manager;

    const sale = await manager.findOne(UsedBookSale, {
      where: { id: saleId },
      relations: ['user'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== sellerId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return sale;
  }

  /**
   * 거래 상대로 지정하려는 사용자가 이 판매글로 실제 대화한 상대인지 확인하고,
   * 기록에 남길 채팅방 ID를 돌려줍니다.
   *
   * 완료 기록은 후기와 신뢰 지표의 근거이자 알림의 발송처이므로, 아무나 상대로
   * 넣어 평판을 부풀리거나 모르는 사람에게 거래 알림을 보내지 못하도록
   * **이 판매글의 채팅방 참여자**로 제한합니다.
   *
   * 호출자가 넘긴 `chatRoomId`도 그대로 믿지 않고 이 판매글의 방인지 확인합니다.
   * 믿으면 남의 채팅방 ID를 넣어 거기에 거래 시스템 메시지를 심을 수 있습니다.
   * 넘기지 않았다면 이 판매글의 방 중에서 직접 찾아 채웁니다.
   *
   * @param options.requireActive 방에 남아 있는 상대만 허용할지. 예약은 앞으로
   *   대화할 상대를 고르는 것이라 `true`, 완료는 이미 끝난 거래를 기록하는
   *   것이라 나간 상대도 허용하도록 `false`를 씁니다.
   */
  private async resolveCounterpartyRoom(
    saleId: number,
    buyerId: number,
    chatRoomId: number | null | undefined,
    options: { requireActive: boolean },
  ): Promise<number> {
    const query = this.chatParticipantRepository
      .createQueryBuilder('participant')
      .innerJoinAndSelect('participant.user', 'user')
      .innerJoinAndSelect('participant.chatRoom', 'room')
      .innerJoin('room.usedBookSale', 'sale')
      .select([
        'participant.id',
        'participant.isActive',
        'room.id',
        'user.id',
        'user.deletedAt',
      ])
      .where('sale.id = :saleId', { saleId })
      .andWhere('user.id = :buyerId', { buyerId })
      // 여러 방이 걸리면 남아 있는 방을, 그중에서도 최근 방을 고른다.
      .orderBy('participant.isActive', 'DESC')
      .addOrderBy('room.id', 'DESC');

    if (chatRoomId) {
      query.andWhere('room.id = :chatRoomId', { chatRoomId });
    }

    const participants = await query.getMany();

    if (participants.length === 0) {
      // 방을 지정했는데 없다면 그 방이 이 판매글의 방이 아니거나 상대가 그 방에
      // 없는 것이고, 지정하지 않았다면 대화 이력 자체가 없는 것이다.
      throw new BusinessException(
        chatRoomId
          ? 'TRADE_CHAT_ROOM_MISMATCH'
          : 'TRADE_COUNTERPARTY_NOT_IN_CHAT',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (participants.some((participant) => participant.user?.deletedAt)) {
      throw new BusinessException(
        'CHAT_PARTICIPANT_WITHDRAWN',
        HttpStatus.BAD_REQUEST,
      );
    }

    const active = participants.find((participant) => participant.isActive);

    if (options.requireActive && !active) {
      throw new BusinessException(
        'CHAT_PARTICIPANT_INACTIVE',
        HttpStatus.BAD_REQUEST,
      );
    }

    return (active ?? participants[0]).chatRoom.id;
  }

  private async hasActiveOrder(saleId: number): Promise<boolean> {
    const activeOrder = await this.orderRepository.findOne({
      where: { saleId, status: In([...ACTIVE_ORDER_STATUSES]) },
    });
    return !!activeOrder;
  }
}

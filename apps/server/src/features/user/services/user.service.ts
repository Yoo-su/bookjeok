import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';

import { SocialLoginDto } from '@/features/auth/dtos/social-login.dto';
import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ACTIVE_ORDER_STATUSES } from '@/features/order/constants';
import { Order } from '@/features/order/entities/order.entity';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { Review } from '@/features/review/entities/review.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';
import { MailService } from '@/shared/mail/mail.service';

import {
  PUBLIC_PROFILE_READING_LOG_LIMIT,
  PUBLIC_PROFILE_RECENT_ITEM_COUNT,
} from '../constants';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(TradeCompletion)
    private readonly tradeCompletionRepository: Repository<TradeCompletion>,
    @InjectRepository(ReadingLog)
    private readonly readingLogRepository: Repository<ReadingLog>,
    private readonly dataSource: DataSource,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly eventEmitter: EventEmitter2,
    private readonly mailService: MailService,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async onModuleInit() {
    // 개발 환경 편의성을 위해 서버 시작 시 유저 ID 시퀀스를 동기화합니다.
    if (process.env.NODE_ENV !== 'production') {
      try {
        await this.dataSource.query(
          `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) + 1 FROM users), 1), false)`,
        );
        this.logger.log('User ID sequence synchronized.');
      } catch (e) {
        this.logger.warn('Failed to sync user sequence:', e);
      }
    }
  }

  /**
   * 소셜 제공자 ID로 유저를 조회합니다.
   * @param provider 제공자 (naver 등)
   * @param providerId 제공자 측 유저 ID
   * @returns 유저 엔티티 또는 null
   */
  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { provider, providerId },
    });
  }

  /**
   * 새로운 소셜 유저를 생성합니다.
   * @param socialLoginDto 소셜 로그인 정보
   * @returns 생성된 유저
   */
  async createUser(socialLoginDto: SocialLoginDto): Promise<User> {
    const handle = `user_${Math.random().toString(36).substring(2, 10)}`;
    const newUser = this.userRepository.create({
      ...socialLoginDto,
      handle,
      isEmailVerified: socialLoginDto.isEmailVerified ?? true,
    });
    return await this.userRepository.save(newUser);
  }

  /**
   * 이메일 기반 유저를 생성합니다.
   * @param email 이메일
   * @param password 암호화된 비밀번호
   * @param nickname 닉네임
   * @param name 실명
   * @param gender 성별
   * @param ageRange 연령대
   * @param verificationToken 이메일 인증 토큰
   * @param verificationExpiresAt 이메일 인증 만료 시간
   * @returns 생성된 유저
   */
  async createEmailUser(
    email: string,
    password: string,
    nickname: string,
    name: string,
    gender?: string | null,
    ageRange?: string | null,
    verificationToken?: string | null,
    verificationExpiresAt?: Date | null,
  ): Promise<User> {
    let handle = `user_${Math.random().toString(36).substring(2, 10)}`;
    let isUnique = false;
    let retryCount = 0;

    // 핸들 중복 검사 및 재생성 (최대 3회)
    while (!isUnique && retryCount < 3) {
      const existing = await this.userRepository.findOne({ where: { handle } });
      if (!existing) {
        isUnique = true;
      } else {
        handle = `user_${Math.random().toString(36).substring(2, 10)}`;
        retryCount++;
      }
    }

    if (!isUnique) {
      // 3회 실패 시 타임스탬프 추가
      handle = `${handle}_${Date.now().toString().slice(-4)}`;
    }

    const newUser = this.userRepository.create({
      provider: 'local',
      providerId: email,
      email,
      password,
      nickname,
      name,
      gender: gender || null,
      ageRange: ageRange || null,
      handle,
      isEmailVerified: false,
      emailVerificationToken: verificationToken || null,
      emailVerificationExpiresAt: verificationExpiresAt || null,
      profileImageUrl: `default_profile${Math.floor(Math.random() * 10) + 1}`,
    });
    return await this.userRepository.save(newUser);
  }

  /**
   * 이메일로 유저를 조회합니다.
   * @param email 이메일
   * @returns 유저 엔티티 또는 null
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * 핸들로 유저를 조회합니다.
   * @param handle 유저 핸들
   * @returns 유저 엔티티 또는 null
   */
  async findByHandle(handle: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { handle } });
  }

  /**
   * 유저 정보를 업데이트합니다.
   * 닉네임 및 이메일 변경 시 중복 검사를 수행하며, 이메일 변경 시 미인증 상태로 전환 후 인증 메일을 발송합니다.
   * @param userId 유저 ID
   * @param updateUserDto 업데이트할 유저 정보
   * @returns 업데이트된 유저
   */
  async updateUser(
    userId: number,
    updateUserDto: Partial<User>,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 닉네임 변경 시 중복 검사
    if (updateUserDto.nickname && updateUserDto.nickname !== user.nickname) {
      const existingUser = await this.findByNickname(updateUserDto.nickname);
      if (existingUser && existingUser.id !== userId) {
        throw new BusinessException(
          'NICKNAME_ALREADY_EXISTS',
          HttpStatus.CONFLICT,
        );
      }
    }

    // 이메일 변경/등록 시 검증 및 재인증 처리
    let newVerificationToken: string | null = null;
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      // 네이버 등 이미 소셜 프로필 이메일이 연동된 계정은 변경 제한 (로컬 계정, 카카오 계정, 또는 기존 이메일이 없는 소셜 계정은 허용)
      const isAllowedToChangeEmail =
        user.provider === 'local' || user.provider === 'kakao' || !user.email;

      if (!isAllowedToChangeEmail) {
        throw new BusinessException(
          'SOCIAL_USER_EMAIL_CHANGE_NOT_ALLOWED',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingEmailUser = await this.findByEmail(updateUserDto.email);
      if (existingEmailUser && existingEmailUser.id !== userId) {
        throw new BusinessException(
          'EMAIL_ALREADY_EXISTS',
          HttpStatus.CONFLICT,
        );
      }

      // 이메일 변경 시 미인증 상태 전환 & 24시간 유효 인증 토큰 생성
      newVerificationToken = crypto.randomUUID();
      updateUserDto.isEmailVerified = false;
      updateUserDto.emailVerificationToken = newVerificationToken;
      updateUserDto.emailVerificationExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );

      // 로컬 유저만 providerId를 이메일과 동기화
      if (user.provider === 'local') {
        updateUserDto.providerId = updateUserDto.email;
      }
    }

    const updatedUser = this.userRepository.merge(user, updateUserDto);
    const savedUser = await this.userRepository.save(updatedUser);

    // 이메일이 변경된 경우 새 주소로 인증 메일 발송
    if (newVerificationToken && savedUser.email) {
      this.mailService
        .sendVerificationEmail(
          savedUser.email,
          savedUser.nickname,
          newVerificationToken,
        )
        .catch((err) =>
          this.logger.error(
            'Failed to send verification email on email change:',
            err,
          ),
        );
    }

    return savedUser;
  }

  /**
   * 닉네임으로 유저를 조회합니다.
   * @param nickname 닉네임
   * @returns 유저 엔티티 또는 null
   */
  async findByNickname(nickname: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { nickname } });
  }

  /**
   * 닉네임 사용 가능 여부를 확인합니다.
   * @param nickname 확인할 닉네임
   * @param currentUserId 현재 사용자 ID (본인 닉네임은 사용 가능)
   * @returns 사용 가능 여부
   */
  async checkNicknameAvailability(
    nickname: string,
    currentUserId?: number,
  ): Promise<boolean> {
    const existingUser = await this.findByNickname(nickname);
    if (!existingUser) return true;
    // 본인의 현재 닉네임이면 사용 가능
    if (currentUserId && existingUser.id === currentUserId) return true;
    return false;
  }

  /**
   * ID로 유저를 조회합니다.
   * @param id 유저 ID
   * @returns 유저 엔티티 또는 null
   */
  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * 핸들로 공개 사용자 프로필을 조회합니다.
   * 민감 정보를 제외한 공개 가능한 정보만 반환합니다.
   * @param handle 사용자 핸들
   * @returns 공개 프로필 정보
   */
  async getPublicProfileByHandle(handle: string) {
    const decodedHandle = decodeURIComponent(handle);
    const selectFields: (keyof User)[] = [
      'id',
      'nickname',
      'handle',
      'profileImageUrl',
      'createdAt',
      'deletedAt',
      'isReadingLogPublic',
      'isEmailVerified',
      'lastActiveAt',
    ];

    // 1. 사용자 기본 정보 조회 (핸들 -> 닉네임 -> ID 순서로 시도)
    // 세 조건을 OR로 한 번에 던진다. 순차 조회는 없는 사용자일 때 매번 세 번
    // 왕복했고, 그 경로가 곧 404 응답 경로다.
    const numericId = /^\d+$/.test(decodedHandle)
      ? Number(decodedHandle)
      : null;

    const candidates = await this.userRepository.find({
      where:
        numericId !== null
          ? [
              { handle: decodedHandle },
              { nickname: decodedHandle },
              { id: numericId },
            ]
          : [{ handle: decodedHandle }, { nickname: decodedHandle }],
      select: selectFields,
    });

    // 우선순위는 기존과 같다: 핸들 > 닉네임 > ID
    const user =
      candidates.find((c) => c.handle === decodedHandle) ??
      candidates.find((c) => c.nickname === decodedHandle) ??
      candidates.find((c) => c.id === numericId);

    if (!user || user.deletedAt) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const userId = user.id;

    // 2. 통계 조회
    const [salesCount, reviewsCount] = await Promise.all([
      this.usedBookSaleRepository.count({
        where: { user: { id: userId }, status: SaleStatus.FOR_SALE },
      }),
      this.reviewRepository.count({
        where: { user: { id: userId } },
      }),
    ]);

    // 3. 최근 리뷰 3개 조회
    const recentReviews = await this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['book'],
      order: { createdAt: 'DESC' },
      take: PUBLIC_PROFILE_RECENT_ITEM_COUNT,
    });

    // 4. 최근 판매글 3개 조회 (판매 중인 것만)
    // 상태 필터가 없으면 내려둔 글(WITHDRAWN)까지 남의 프로필에 뜬다.
    // 바로 위 salesCount도 FOR_SALE만 세므로 기준을 맞춘다.
    const recentSales = await this.usedBookSaleRepository.find({
      where: { user: { id: userId }, status: SaleStatus.FOR_SALE },
      relations: ['book'],
      order: { createdAt: 'DESC' },
      take: PUBLIC_PROFILE_RECENT_ITEM_COUNT,
    });

    const readingLogs = user.isReadingLogPublic
      ? await this.getPublicReadingLogs(userId)
      : [];

    return {
      id: user.id,
      handle: user.handle,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      isEmailVerified: user.isEmailVerified,
      lastActiveAt: user.lastActiveAt ?? null,
      stats: {
        salesCount,
        reviewsCount,
      },
      recentReviews: recentReviews.map((review) => ({
        id: review.id,
        title: review.title,
        bookTitle: review.book?.title || '',
        bookImage: review.book?.image || null,
        createdAt: review.createdAt,
      })),
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        bookTitle: sale.book?.title || '',
        bookImage: sale.book?.image || null,
        price: sale.price,
        status: sale.status,
        createdAt: sale.createdAt,
      })),
      readingLogs,
    };
  }

  /**
   * 공개 프로필에 실을 독서기록을 조회합니다.
   *
   * 상한이 없으면 기록이 많은 유저 프로필 한 번에 전체 행 + 도서 조인이
   * 딸려 나옵니다. 프로필은 최근 것만 보여주므로 여기서 잘라냅니다.
   */
  private async getPublicReadingLogs(userId: number) {
    return await this.readingLogRepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['book'],
      order: { date: 'DESC' },
      take: PUBLIC_PROFILE_READING_LOG_LIMIT,
    });
  }

  /**
   * 특정 사용자가 작성한 모든 중고책 판매글을 조회합니다.
   * @param userId - 사용자 ID
   * @returns 사용자의 판매글 목록
   */
  async findMySales(userId: number): Promise<UsedBookSale[]> {
    const sales = await this.usedBookSaleRepository.find({
      where: { user: { id: userId } },
      relations: ['book', 'user'],
      order: { createdAt: 'DESC' },
    });

    if (sales.length === 0) return sales;

    // 판매글 관리 화면이 수정·삭제·상태변경 잠금 여부를 판단할 근거.
    // 판매글마다 조회하지 않도록 활성 주문을 한 번에 모아 표시한다.
    const activeOrders = await this.orderRepository.find({
      where: {
        saleId: In(sales.map((sale) => sale.id)),
        status: In([...ACTIVE_ORDER_STATUSES]),
      },
      select: ['saleId'],
    });
    const lockedSaleIds = new Set(activeOrders.map((order) => order.saleId));

    // 거래 기록이 있는 판매완료 글은 상태를 되돌릴 수 없다.
    const completions = await this.tradeCompletionRepository.find({
      where: { saleId: In(sales.map((sale) => sale.id)) },
      select: ['saleId'],
    });
    const completedSaleIds = new Set(
      completions.map((completion) => completion.saleId),
    );

    return sales.map((sale) => {
      sale.hasActiveOrder = lockedSaleIds.has(sale.id);
      sale.hasTradeCompletion = completedSaleIds.has(sale.id);
      return sale;
    });
  }

  /**
   * 유저의 활동 통계(판매글 수, 채팅방 수, 리뷰 수 등)를 조회합니다.
   * @param userId 유저 ID
   * @returns 통계 정보
   */
  async getUserStats(userId: number) {
    // 1. 판매글 통계
    // 상태별 개수는 DB에서 집계한다. 예전에는 전 행을 메모리로 가져와 셌는데,
    // 판매글이 많은 유저일수록 그대로 비용이 늘었다.
    const [salesStatusRows, chatRoomCount, reviewsCount] = await Promise.all([
      this.usedBookSaleRepository
        .createQueryBuilder('sale')
        .select('sale.status', 'status')
        .addSelect('COUNT(*)', 'count')
        // userId는 엔티티 프로퍼티가 아니라 관계의 조인 컬럼이다. 따옴표를
        // 빼면 Postgres가 소문자로 접어 userid를 찾다가 실패한다.
        .where('sale."userId" = :userId', { userId })
        .groupBy('sale.status')
        .getRawMany<{ status: SaleStatus; count: string }>(),

      // 2. 채팅방 통계 (활성화된 채팅방 수)
      this.chatParticipantRepository.count({
        where: { user: { id: userId }, isActive: true },
      }),

      // 3. 리뷰 통계
      this.reviewRepository.count({
        where: { user: { id: userId } },
      }),
    ]);

    const salesStatusCounts = {} as Record<SaleStatus, number>;
    let salesCount = 0;

    for (const row of salesStatusRows) {
      const count = Number(row.count);
      salesStatusCounts[row.status] = count;
      salesCount += count;
    }

    return {
      salesCount,
      salesStatusCounts,
      chatRoomCount,
      reviewsCount,
    };
  }

  /**
   * 회원 탈퇴를 처리합니다. 유저 정보를 익명화하고 관련 데이터를 정리합니다.
   * @param userId 유저 ID
   */
  async withdraw(userId: number): Promise<void> {
    const releasedSales = await this.persistWithdraw(userId);

    // 커밋 후 발행. 같은 판매글의 다른 채팅방에 판매 재개 안내
    for (const sale of releasedSales) {
      this.eventEmitter.emit('trade.reservation_cancelled', {
        saleId: sale.id,
        sellerId: sale.user.id,
        buyerId: userId,
      });
    }
  }

  /**
   * 탈퇴의 상태 변경을 한 트랜잭션에서 수행합니다.
   * @returns 구매자로 예약돼 있다가 판매중으로 되돌린 판매글
   */
  @Transactional()
  private async persistWithdraw(userId: number): Promise<UsedBookSale[]> {
    const manager = this.txHost.tx;

    // 0. 활성 거래 여부 검증 (자신이 판매자 또는 구매자로 참여 중인 활성 주문이 있는 경우 탈퇴 불가)
    const activeOrder = await manager.findOne(Order, {
      where: [
        { buyerId: userId, status: In([...ACTIVE_ORDER_STATUSES]) },
        { sellerId: userId, status: In([...ACTIVE_ORDER_STATUSES]) },
      ],
    });

    if (activeOrder) {
      throw new BusinessException(
        'USER_IN_TRADE_CANNOT_WITHDRAW',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 판매자 예약은 본인이 취소·완료할 수 있으므로 차단
    const reservedSale = await manager.findOne(UsedBookSale, {
      where: { user: { id: userId }, status: SaleStatus.RESERVED },
      select: { id: true },
    });

    if (reservedSale) {
      throw new BusinessException(
        'USER_HAS_RESERVED_SALE_CANNOT_WITHDRAW',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await manager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 1. 사용자 정보 익명화
    const timestamp = new Date().getTime();
    user.nickname = '(알수없음)';
    user.profileImageUrl = '';
    user.providerId = `deleted_${user.id}_${timestamp}`;
    user.email = `deleted_${user.id}_${timestamp}`;
    user.deletedAt = new Date();

    await manager.save(user);

    // 2. 구매자로 예약된 남의 판매글을 판매중으로 해제 (판매자가 탈퇴자에게 묶이지 않게)
    const releasedSales = await manager.find(UsedBookSale, {
      where: { reservedForUserId: userId, status: SaleStatus.RESERVED },
      relations: { user: true },
      select: { id: true, user: { id: true } },
    });

    if (releasedSales.length > 0) {
      await manager.update(
        UsedBookSale,
        { id: In(releasedSales.map((sale) => sale.id)) },
        { status: SaleStatus.FOR_SALE, reservedForUserId: null },
      );
    }

    // 3. 도메인 클린업 이벤트 동기식 발행 (EntityManager 주입)
    await this.eventEmitter.emitAsync('user.withdrawn', {
      userId,
      entityManager: manager,
    });

    return releasedSales;
  }

  /**
   * 사용자의 마지막 활동 시간을 현재 시간으로 업데이트합니다.
   * @param userId 유저 ID
   */
  async updateLastActiveAt(userId: number): Promise<void> {
    await this.userRepository.update(userId, { lastActiveAt: new Date() });
  }

  /**
   * 토큰 버전을 1 증가시켜 기존 발급된 모든 Refresh Token을 무효화합니다.
   * @param userId 유저 ID
   */
  async incrementTokenVersion(userId: number): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'tokenVersion', 1);
  }

  /**
   * 이메일 인증 토큰을 검증하고 이메일 인증을 완료합니다.
   * @param token 이메일 인증 토큰
   * @returns 인증 완료된 유저
   */
  async verifyEmailToken(token: string): Promise<User> {
    if (!token) {
      throw new BusinessException(
        'INVALID_OR_EXPIRED_VERIFICATION_TOKEN',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BusinessException(
        'INVALID_OR_EXPIRED_VERIFICATION_TOKEN',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BusinessException(
        'EXPIRED_VERIFICATION_TOKEN',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiresAt = null;

    return await this.userRepository.save(user);
  }

  /**
   * 인증 메일을 재발송합니다.
   * @param userId 사용자 ID
   */
  async resendVerificationEmail(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new BusinessException('ALREADY_VERIFIED', HttpStatus.BAD_REQUEST);
    }

    if (!user.email) {
      throw new BusinessException('EMAIL_NOT_FOUND', HttpStatus.BAD_REQUEST);
    }

    const token = crypto.randomUUID();
    user.emailVerificationToken = token;
    user.emailVerificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    await this.userRepository.save(user);
    await this.mailService.sendVerificationEmail(
      user.email,
      user.nickname,
      token,
    );
  }
}

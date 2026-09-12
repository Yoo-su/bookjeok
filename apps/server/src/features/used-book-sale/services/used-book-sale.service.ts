import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { In, Repository } from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { ACTIVE_ORDER_STATUSES } from '@/features/order/constants';
import { Order } from '@/features/order/entities/order.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions';

import { POPULAR_SALE_MONTHS } from '../constants';
import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { GetBookSalesQueryDto } from '../dtos/get-book-sales-query.dto';
import { BookSaleSortBy, QueryBookSaleDto } from '../dtos/query-book-sale.dto';
import { UpdateBookSaleDto } from '../dtos/update-book-sale.dto';
import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';
import {
  applyCommonFilters,
  applyCursorFilter,
  applyLocationFilter,
  applySorting,
  encodeCursor,
} from '../utils/sale-query.builder';

/**
 * 판매글 목록 응답에 싣는 컬럼.
 * 검색 목록과 ISBN별 목록이 같은 화면 카드를 그리므로 한 곳에서 정의한다.
 */
const SALE_LIST_SELECT = [
  'sale.id',
  'sale.title',
  'sale.price',
  'sale.status',
  'sale.createdAt',
  'sale.updatedAt',
  'sale.imageUrls',
  'sale.city',
  'sale.district',
  'sale.viewCount',
  'user.id',
  'user.handle',
  'user.nickname',
  'user.profileImageUrl',
  'book',
];

@Injectable()
export class UsedBookSaleService {
  // 인기 판매글 및 지역 목록 캐시 키/TTL
  private static readonly POPULAR_SALES_CACHE_KEY = 'popular_sales';
  private static readonly REGIONS_CACHE_KEY = 'available_book_sale_regions';
  private static readonly CACHE_TTL = 600000;

  constructor(
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(TradeCompletion)
    private readonly tradeCompletionRepository: Repository<TradeCompletion>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 중고책 판매글을 생성합니다.
   * BookResolvePipe를 통해 도서 정보가 DB에 존재함이 보장됩니다.
   * @param createBookSaleDto 판매글 생성 DTO
   * @param userId 작성자 ID
   * @returns 생성된 판매글
   */
  async createUsedBookSale(
    createBookSaleDto: CreateBookSaleDto,
    userId: number,
  ): Promise<UsedBookSale> {
    const { isbn, ...saleData } = createBookSaleDto;

    // 엔티티 생성 및 관계 설정 (ID 참조 방식 활용으로 추가 조회 최소화)
    const newSale = this.usedBookSaleRepository.create({
      ...saleData,
      user: { id: userId } as User,
      book: { isbn } as Book,
    });

    const savedSale = await this.usedBookSaleRepository.save(newSale);
    await this.cacheManager.del(UsedBookSaleService.REGIONS_CACHE_KEY);

    // 저장 후 도서·유저 정보를 포함하여 다시 조회
    return (await this.usedBookSaleRepository.findOne({
      where: { id: savedSale.id },
      relations: ['user', 'book'],
    }))!;
  }

  /**
   * 특정 판매글의 상태를 업데이트합니다.
   */
  async updateSaleStatus(
    saleId: number,
    userId: number,
    status: SaleStatus,
  ): Promise<UsedBookSale> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user', 'book'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== userId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // 활성 주문이 걸려있는 판매글은 수동 상태 변경 차단
    if (await this.hasActiveOrder(saleId)) {
      throw new BusinessException(
        'SALE_IN_TRADE_CANNOT_CHANGE_STATUS',
        HttpStatus.CONFLICT,
      );
    }

    // 거래 기록이 남은 판매완료는 종료 상태다. 되돌리면 후기와 신뢰 지표가
    // 성사되지 않은 거래 위에 남는다. (기록 없이 상태만 판매완료인 글은
    // 오조작일 수 있으므로 되돌릴 수 있게 둔다)
    if (
      sale.status === SaleStatus.SOLD &&
      status !== SaleStatus.SOLD &&
      (await this.hasTradeCompletion(saleId))
    ) {
      throw new BusinessException(
        'SALE_COMPLETED_CANNOT_CHANGE_STATUS',
        HttpStatus.CONFLICT,
      );
    }

    sale.status = status;

    // 예약중을 벗어나면 거래 상대 지정도 함께 풀어야 한다. 남겨두면 판매중인
    // 글인데도 다른 채팅방에 "다른 구매자와 거래 중" 안내가 계속 뜬다.
    // (화면은 예약 취소 API로 우회하지만, 이 엔드포인트를 직접 부를 수 있다)
    if (status !== SaleStatus.RESERVED) {
      sale.reservedForUserId = null;
    }

    sale.updatedAt = new Date();
    return await this.usedBookSaleRepository.save(sale);
  }

  private async hasActiveOrder(saleId: number): Promise<boolean> {
    const activeOrder = await this.orderRepository.findOne({
      where: { saleId, status: In([...ACTIVE_ORDER_STATUSES]) },
    });
    return !!activeOrder;
  }

  private async hasTradeCompletion(saleId: number): Promise<boolean> {
    const completion = await this.tradeCompletionRepository.findOne({
      where: { saleId },
    });
    return !!completion;
  }

  /**
   * 주어진 판매글 중 거래 완료 기록이 있는 것들의 ID 집합을 반환합니다.
   */
  async findSaleIdsWithCompletion(saleIds: number[]): Promise<Set<number>> {
    if (saleIds.length === 0) return new Set();

    const completions = await this.tradeCompletionRepository.find({
      where: { saleId: In(saleIds) },
      select: ['saleId'],
    });

    return new Set(completions.map((completion) => completion.saleId));
  }

  /**
   * 주어진 판매글 중 활성 주문이 걸려 있는 것들의 ID 집합을 반환합니다.
   * 목록 응답에 잠금 여부를 붙일 때 N+1 없이 한 번에 조회하는 용도입니다.
   */
  async findSaleIdsWithActiveOrder(saleIds: number[]): Promise<Set<number>> {
    if (saleIds.length === 0) return new Set();

    const activeOrders = await this.orderRepository.find({
      where: { saleId: In(saleIds), status: In([...ACTIVE_ORDER_STATUSES]) },
      select: ['saleId'],
    });

    return new Set(activeOrders.map((order) => order.saleId));
  }

  /**
   * 판매글 조회수를 증가시킵니다.
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.usedBookSaleRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 인기 판매글을 조회합니다.
   * 최근 POPULAR_SALE_MONTHS개월 내 조회수 높은 순으로 6개 반환 (결과 캐싱)
   */
  async findPopularSales(): Promise<UsedBookSale[]> {
    // 1. 캐시 확인
    const cached = await this.cacheManager.get<UsedBookSale[]>(
      UsedBookSaleService.POPULAR_SALES_CACHE_KEY,
    );
    if (cached) return cached;

    // 2. 인기 판매글 ID 조회
    const idResults = await this.getPopularSaleIds(6);
    if (idResults.length === 0) return [];

    const ids = idResults.map((r) => r.id);

    // 3. 엔티티 상세 조회 및 순서 유지
    const result = await this.findSalesByIdsInOrder(ids);

    // 4. 결과 캐싱 (10분)
    await this.cacheManager.set(
      UsedBookSaleService.POPULAR_SALES_CACHE_KEY,
      result,
      UsedBookSaleService.CACHE_TTL,
    );

    return result;
  }

  /**
   * 최근 POPULAR_SALE_MONTHS개월 내 조회수가 가장 높은 판매 중인 글 ID를 조회합니다.
   */
  private async getPopularSaleIds(limit: number): Promise<{ id: number }[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - POPULAR_SALE_MONTHS);

    return await this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .select('sale.id', 'id')
      .where('sale.status = :status', { status: SaleStatus.FOR_SALE })
      .andWhere('sale.createdAt >= :since', { since })
      .orderBy('sale.viewCount', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /**
   * ID 목록에 해당하는 판매글을 주어진 ID 순서대로 조회합니다.
   */
  private async findSalesByIdsInOrder(ids: number[]): Promise<UsedBookSale[]> {
    const sales = await this.usedBookSaleRepository.find({
      where: { id: In(ids) },
      relations: ['user', 'book'],
    });

    const saleMap = new Map(sales.map((s) => [s.id, s]));
    return ids
      .map((id) => saleMap.get(id))
      .filter((s): s is UsedBookSale => !!s);
  }

  /**
   * ID로 판매글을 조회합니다.
   */
  async findSaleById(id: number) {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    sale.hasActiveOrder = await this.hasActiveOrder(id);
    sale.hasTradeCompletion = await this.hasTradeCompletion(id);
    return sale;
  }

  /**
   * 수정을 위한 판매글 조회 (소유권 검증 포함)
   */
  async findSaleForEdit(id: number, userId: number) {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== userId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return sale;
  }

  /**
   * 조건에 따라 판매글 목록을 검색합니다.
   */
  async searchSales(queryDto: QueryBookSaleDto) {
    const {
      page = 1,
      limit = 12,
      sortBy = BookSaleSortBy.CREATED_AT,
    } = queryDto;

    const queryBuilder = this.createBaseSearchQuery();

    applyCommonFilters(queryBuilder, queryDto);
    applyLocationFilter(queryBuilder, queryDto);
    applySorting(
      queryBuilder,
      sortBy,
      queryDto.sortOrder || 'DESC',
      queryDto.lat,
      queryDto.lng,
    );
    applyCursorFilter(queryBuilder, queryDto);

    // limit + 1개를 조회하여 다음 페이지 존재 여부 판별 (COUNT 쿼리 제거)
    queryBuilder.take(limit + 1);

    const { entities: sales, raw } = await queryBuilder.getRawAndEntities();

    // 페이지네이션 정보 계산
    const hasNextPage = sales.length > limit;
    if (hasNextPage) {
      sales.pop(); // 초과 조회분 제거
      raw.pop();
    }

    let nextCursor: string | null = null;

    if (hasNextPage && sales.length > 0) {
      const lastItem = sales[sales.length - 1];
      const lastRaw = raw[raw.length - 1];

      let cursorValue: string | number = lastItem.id;
      if (sortBy === BookSaleSortBy.PRICE) {
        cursorValue = lastItem.price;
      } else if (sortBy === BookSaleSortBy.DISTANCE) {
        cursorValue = Number(lastRaw.distance);
      }

      nextCursor = encodeCursor({ value: cursorValue, id: lastItem.id });
    }

    return {
      sales,
      page,
      limit,
      hasNextPage,
      nextCursor,
    };
  }

  private createBaseSearchQuery() {
    return this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.book', 'book')
      .select(SALE_LIST_SELECT);
  }

  /**
   * ISBN별 판매글 목록을 조회합니다.
   */
  async findSalesByIsbn(isbn: string, queryDto: GetBookSalesQueryDto) {
    const { page, limit, city, district } = queryDto;

    const queryBuilder = this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .where('sale.isbn = :isbn', { isbn })
      .andWhere('sale.status = :status', { status: SaleStatus.FOR_SALE })
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.book', 'book')
      .select(SALE_LIST_SELECT)
      .orderBy('sale.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit + 1); // limit + 1개를 조회하여 다음 페이지 존재 여부 판별

    if (city) {
      queryBuilder.andWhere('sale.city = :city', { city });
    }
    if (district) {
      queryBuilder.andWhere('sale.district = :district', { district });
    }

    const sales = await queryBuilder.getMany();

    const hasNextPage = sales.length > limit;
    if (hasNextPage) {
      sales.pop(); // 초과 조회분 제거
    }

    return {
      sales,
      page,
      hasNextPage,
    };
  }

  /**
   * 판매글을 업데이트합니다.
   */
  async updateUsedBookSale(
    saleId: number,
    userId: number,
    updateBookSaleDto: UpdateBookSaleDto,
  ): Promise<UsedBookSale> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user', 'book'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== userId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // 활성 주문이 걸려있는 판매글은 수정 차단
    if (await this.hasActiveOrder(saleId)) {
      throw new BusinessException(
        'SALE_IN_TRADE_CANNOT_UPDATE',
        HttpStatus.CONFLICT,
      );
    }

    // 거래 기록이 있는 판매글은 수정도 막는다. 후기는 이 판매글에 매달려
    // 있어서, 나쁜 후기를 받은 글의 내용을 바꿔치기하면 삭제를 막아둔 것과
    // 같은 평판 세탁이 된다. (화면도 수정 버튼을 잠그지만 API는 직접 호출된다)
    if (await this.hasTradeCompletion(saleId)) {
      throw new BusinessException(
        'SALE_COMPLETED_CANNOT_UPDATE',
        HttpStatus.CONFLICT,
      );
    }

    const updatedSale = this.usedBookSaleRepository.merge(
      sale,
      updateBookSaleDto,
    );

    updatedSale.updatedAt = new Date();

    return await this.usedBookSaleRepository.save(updatedSale);
  }

  /**
   * 판매글을 삭제합니다.
   */
  async deleteUsedBookSale(
    saleId: number,
    userId: number,
    userRole?: string,
  ): Promise<void> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== userId && userRole !== 'ADMIN') {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // 활성 주문이 걸려있는 판매글은 삭제 차단
    if (await this.hasActiveOrder(saleId)) {
      throw new BusinessException(
        'SALE_IN_TRADE_CANNOT_DELETE',
        HttpStatus.CONFLICT,
      );
    }

    // 거래 기록이 있는 판매글은 삭제할 수 없다.
    // trade_completions가 판매글에 CASCADE로 물려 있고 후기는 다시 거기에
    // 물려 있어서, 삭제하면 받은 후기까지 함께 사라진다. 나쁜 후기를 받은
    // 글을 지워 평판을 세탁하는 경로가 된다. (운영자는 신고 처리를 위해 예외)
    if (userRole !== 'ADMIN' && (await this.hasTradeCompletion(saleId))) {
      throw new BusinessException(
        'SALE_COMPLETED_CANNOT_DELETE',
        HttpStatus.CONFLICT,
      );
    }

    await this.usedBookSaleRepository.remove(sale);
  }

  /**
   * 가장 최근에 등록된 중고책 판매글을 조회합니다. (기본 25개, 최대 50개)
   */
  async findRecentSales(limit: number = 25): Promise<UsedBookSale[]> {
    const take = Math.min(Math.max(Number(limit) || 25, 1), 50);
    return await this.usedBookSaleRepository.find({
      where: { status: SaleStatus.FOR_SALE },
      order: { createdAt: 'DESC' },
      take,
      relations: ['user', 'book'],
    });
  }

  /**
   * 현재 판매 중인 중고책 게시글이 존재하는 지역(시/도 -> 시/군/구[]) 목록을 조회합니다.
   * 결과는 10분간 캐싱됩니다.
   */
  async getAvailableRegions(): Promise<Record<string, string[]>> {
    const cached = await this.cacheManager.get<Record<string, string[]>>(
      UsedBookSaleService.REGIONS_CACHE_KEY,
    );
    if (cached) return cached;

    const rawResults = await this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .select('sale.city', 'city')
      .addSelect('sale.district', 'district')
      .where('sale.status = :status', { status: SaleStatus.FOR_SALE })
      .groupBy('sale.city')
      .addGroupBy('sale.district')
      .getRawMany<{ city: string; district: string }>();

    const result: Record<string, string[]> = {};
    for (const row of rawResults) {
      if (!row.city) continue;
      if (!result[row.city]) {
        result[row.city] = [];
      }
      if (row.district && !result[row.city].includes(row.district)) {
        result[row.city].push(row.district);
      }
    }

    await this.cacheManager.set(
      UsedBookSaleService.REGIONS_CACHE_KEY,
      result,
      UsedBookSaleService.CACHE_TTL,
    );
    return result;
  }
}

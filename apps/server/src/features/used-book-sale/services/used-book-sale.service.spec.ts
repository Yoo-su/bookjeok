import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';
import { Order, OrderStatus } from '@/features/order/entities/order.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import { UserService } from '@/features/user/services/user.service';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';
import { UsedBookSaleService } from './used-book-sale.service';

describe('UsedBookSaleService', () => {
  let service: UsedBookSaleService;
  let mockDataSource: Partial<DataSource>;
  let mockManager: Partial<EntityManager>;

  const mockUsedBookSaleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
    remove: jest.fn(),
    merge: jest.fn(),
  };

  const mockOrderRepository = {
    findOne: jest.fn(),
  };

  const mockTradeCompletionRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  };

  const mockBookService = {
    resolveBook: jest.fn(),
  };
  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    // 트랜잭션 매니저 Mock (하위 호환성 위해 유지하거나 제거)
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // DataSource.transaction Mock
    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => {
        return cb(mockManager) as Promise<any>;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsedBookSaleService,
        {
          provide: getRepositoryToken(UsedBookSale),
          useValue: mockUsedBookSaleRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(TradeCompletion),
          useValue: mockTradeCompletionRepository,
        },
        { provide: BookService, useValue: mockBookService },
        { provide: UserService, useValue: mockUserService },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsedBookSaleService>(UsedBookSaleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUsedBookSale', () => {
    const userId = 1;
    const createDto: CreateBookSaleDto = {
      isbn: '123',
      price: 10000,
      title: 'Test Sale',
      content: 'Content',
      city: 'Seoul',
      district: 'Gangnam',
      latitude: 0,
      longitude: 0,
      imageUrls: [],
      placeName: 'Test Place',
    };

    it('성공적으로 판매글을 생성해야 합니다', async () => {
      // 1. 판매글 생성 객체 리턴
      const expectedSale = {
        id: 1,
        ...createDto,
        isbn: undefined,
        book: { isbn: '123' },
        user: { id: userId },
      };
      mockUsedBookSaleRepository.create.mockReturnValue(expectedSale);
      mockUsedBookSaleRepository.save.mockResolvedValue(expectedSale);
      // save 후 relations 포함 재조회
      mockUsedBookSaleRepository.findOne.mockResolvedValue(expectedSale);

      // 실행
      const result = await service.createUsedBookSale(createDto, userId);

      // 검증
      expect(result).toEqual(expectedSale);
      expect(mockUsedBookSaleRepository.create).toHaveBeenCalled();
      expect(mockUsedBookSaleRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUsedBookSaleRepository.findOne).toHaveBeenCalledWith({
        where: { id: expectedSale.id },
        relations: ['user', 'book'],
      });
    });
  });

  describe('updateSaleStatus - edge case', () => {
    it('활성 주문이 존재하는 판매글의 상태 변경 시 SALE_IN_TRADE_CANNOT_CHANGE_STATUS 예외를 던져야 합니다', async () => {
      const sale = { id: 10, user: { id: 1 }, status: SaleStatus.FOR_SALE };
      mockUsedBookSaleRepository.findOne.mockResolvedValue(sale);
      mockOrderRepository.findOne.mockResolvedValue({
        id: 1,
        saleId: 10,
        status: OrderStatus.PAID,
      });

      await expect(
        service.updateSaleStatus(10, 1, SaleStatus.SOLD),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('updateUsedBookSale - edge case', () => {
    it('활성 주문이 존재하는 판매글 수정 시 SALE_IN_TRADE_CANNOT_UPDATE 예외를 던져야 합니다', async () => {
      const sale = { id: 10, user: { id: 1 }, title: '기존 제목' };
      mockUsedBookSaleRepository.findOne.mockResolvedValue(sale);
      mockOrderRepository.findOne.mockResolvedValue({
        id: 1,
        saleId: 10,
        status: OrderStatus.AWAITING_PAYMENT,
      });

      await expect(
        service.updateUsedBookSale(10, 1, { title: '새 제목' } as any),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('deleteUsedBookSale - edge case', () => {
    it('활성 주문이 존재하는 판매글 삭제 시 SALE_IN_TRADE_CANNOT_DELETE 예외를 던져야 합니다', async () => {
      const sale = { id: 10, user: { id: 1 } };
      mockUsedBookSaleRepository.findOne.mockResolvedValue(sale);
      mockOrderRepository.findOne.mockResolvedValue({
        id: 1,
        saleId: 10,
        status: OrderStatus.SHIPPED,
      });

      await expect(service.deleteUsedBookSale(10, 1)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('deleteUsedBookSale - 거래 기록 보호', () => {
    it('거래 기록이 있는 판매글은 삭제할 수 없다', async () => {
      // trade_completions가 판매글에 CASCADE로 물려 있어 삭제하면 받은 후기까지
      // 사라진다. 나쁜 후기를 지우는 평판 세탁 경로가 된다.
      mockUsedBookSaleRepository.findOne.mockResolvedValue({
        id: 100,
        user: { id: 1 },
      } as never);
      mockOrderRepository.findOne.mockResolvedValue(null);
      mockTradeCompletionRepository.findOne.mockResolvedValue({ id: 5 });

      await expect(service.deleteUsedBookSale(100, 1)).rejects.toThrow(
        BusinessException,
      );
      expect(mockUsedBookSaleRepository.remove).not.toHaveBeenCalled();
    });

    it('운영자는 신고 처리를 위해 삭제할 수 있다', async () => {
      mockUsedBookSaleRepository.findOne.mockResolvedValue({
        id: 100,
        user: { id: 1 },
      } as never);
      mockOrderRepository.findOne.mockResolvedValue(null);
      mockTradeCompletionRepository.findOne.mockResolvedValue({ id: 5 });
      mockUsedBookSaleRepository.remove.mockResolvedValue(undefined);

      await service.deleteUsedBookSale(100, 999, 'ADMIN');

      expect(mockUsedBookSaleRepository.remove).toHaveBeenCalled();
    });
  });

  describe('updateSaleStatus - 판매완료 되돌리기', () => {
    const seller = { id: 1 };
    const soldSale = () =>
      ({
        id: 100,
        status: SaleStatus.SOLD,
        user: seller,
      }) as never;

    beforeEach(() => {
      mockOrderRepository.findOne.mockResolvedValue(null);
      mockUsedBookSaleRepository.save.mockImplementation((v: unknown) => v);
    });

    it('거래 기록이 있으면 판매중으로 되돌릴 수 없다', async () => {
      mockUsedBookSaleRepository.findOne.mockResolvedValue(soldSale());
      mockTradeCompletionRepository.findOne.mockResolvedValue({ id: 5 });

      await expect(
        service.updateSaleStatus(100, seller.id, SaleStatus.FOR_SALE),
      ).rejects.toThrow(BusinessException);
    });

    it('거래 기록이 없으면 되돌릴 수 있다', async () => {
      mockUsedBookSaleRepository.findOne.mockResolvedValue(soldSale());
      mockTradeCompletionRepository.findOne.mockResolvedValue(null);

      const result = await service.updateSaleStatus(
        100,
        seller.id,
        SaleStatus.FOR_SALE,
      );

      expect(result.status).toBe(SaleStatus.FOR_SALE);
    });
  });

  describe('updateSaleStatus - 예약 상대 정리', () => {
    const seller = { id: 1 };

    beforeEach(() => {
      mockOrderRepository.findOne.mockResolvedValue(null);
      mockTradeCompletionRepository.findOne.mockResolvedValue(null);
      mockUsedBookSaleRepository.save.mockImplementation((v: unknown) => v);
    });

    it('예약중을 벗어나면 거래 상대 지정도 함께 풀린다', async () => {
      // 남겨두면 판매중인 글인데도 다른 채팅방에 "다른 구매자와 거래 중"
      // 안내가 계속 뜬다.
      mockUsedBookSaleRepository.findOne.mockResolvedValue({
        id: 100,
        status: SaleStatus.RESERVED,
        reservedForUserId: 42,
        user: seller,
      } as never);

      const result = await service.updateSaleStatus(
        100,
        seller.id,
        SaleStatus.FOR_SALE,
      );

      expect(result.status).toBe(SaleStatus.FOR_SALE);
      expect(result.reservedForUserId).toBeNull();
    });

    it('예약중으로 두면 거래 상대 지정은 유지된다', async () => {
      mockUsedBookSaleRepository.findOne.mockResolvedValue({
        id: 100,
        status: SaleStatus.RESERVED,
        reservedForUserId: 42,
        user: seller,
      } as never);

      const result = await service.updateSaleStatus(
        100,
        seller.id,
        SaleStatus.RESERVED,
      );

      expect(result.reservedForUserId).toBe(42);
    });
  });

  describe('updateUsedBookSale - 거래 기록 보호', () => {
    it('거래 기록이 있는 판매글은 수정할 수 없다', async () => {
      // 후기가 이 판매글에 매달려 있어서, 내용을 바꿔치기하면 삭제를 막아둔
      // 것과 같은 평판 세탁이 된다.
      mockUsedBookSaleRepository.findOne.mockResolvedValue({
        id: 100,
        user: { id: 1 },
      } as never);
      mockOrderRepository.findOne.mockResolvedValue(null);
      mockTradeCompletionRepository.findOne.mockResolvedValue({ id: 5 });

      await expect(
        service.updateUsedBookSale(100, 1, { title: '바뀐 제목' }),
      ).rejects.toThrow(BusinessException);
      expect(mockUsedBookSaleRepository.save).not.toHaveBeenCalled();
    });
  });
});

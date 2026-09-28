import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { EntityManager } from 'typeorm';

import { SaleStatus } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { Wishlist } from '@/features/user/entities/wishlist.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { WishlistService } from './wishlist.service';

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

describe('WishlistService', () => {
  let service: WishlistService;
  let mockTxHost: { tx: Partial<EntityManager> };
  let mockManager: Partial<EntityManager>;
  let wishlistRepo: any;

  beforeEach(async () => {
    const mockQb = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
    };

    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };

    mockTxHost = {
      tx: mockManager,
    };

    wishlistRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      exists: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '5' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: getRepositoryToken(Wishlist), useValue: wishlistRepo },
        { provide: TransactionHost, useValue: mockTxHost },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  describe('addToWishlist', () => {
    it('이미 찜한 항목이 있으면 추가하지 않고 기존 항목을 반환해야 합니다', async () => {
      const existing = { id: 1, user: { id: 1 } };
      (mockManager.findOne as jest.Mock).mockResolvedValue(existing);

      const result = await service.addToWishlist(1, 'BOOK', '1234567890');
      expect(result).toEqual(existing);
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('새 항목 찜 시 orIgnore()를 통해 안전하게 생성하고 조회된 항목을 반환해야 합니다', async () => {
      const book = { isbn: '1234567890' };
      const savedWishlist = { id: 1, user: { id: 1 }, book };

      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // existing check
        .mockResolvedValueOnce(book) // book search check
        .mockResolvedValueOnce(savedWishlist); // saved wishlist fetch

      const result = await service.addToWishlist(1, 'BOOK', '1234567890');
      expect(result).toEqual(savedWishlist);
      expect(mockManager.createQueryBuilder).toHaveBeenCalled();
    });

    it('찜하려는 책이 존재하지 않으면 예외를 던져야 합니다', async () => {
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // existing check
        .mockResolvedValueOnce(null); // book search check

      await expect(
        service.addToWishlist(1, 'BOOK', '1234567890'),
      ).rejects.toThrow(BusinessException);
    });

    it('찜하려는 판매글이 존재하지 않으면 예외를 던져야 합니다', async () => {
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // existing check
        .mockResolvedValueOnce(null); // sale search check

      await expect(service.addToWishlist(1, 'SALE', 999)).rejects.toThrow(
        BusinessException,
      );
    });

    it('찜하려는 판매글 상태가 FOR_SALE이 아니면 예외를 던져야 합니다', async () => {
      const sale = { id: 999, status: SaleStatus.SOLD };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // existing check
        .mockResolvedValueOnce(sale); // sale search check

      await expect(service.addToWishlist(1, 'SALE', 999)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('removeFromWishlist', () => {
    it('찜한 항목이 존재하지 않으면 예외를 던져야 합니다', async () => {
      (wishlistRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.removeFromWishlist(1, 'BOOK', '123'),
      ).rejects.toThrow(BusinessException);
    });

    it('찜한 항목이 존재하면 삭제를 호출해야 합니다', async () => {
      const item = { id: 1 };
      (wishlistRepo.findOne as jest.Mock).mockResolvedValue(item);

      await service.removeFromWishlist(1, 'BOOK', '123');
      expect(wishlistRepo.remove).toHaveBeenCalledWith(item);
    });
  });

  describe('countUniqueWishlistUsers', () => {
    it('고유한 위시리스트 유저 수를 리턴해야 합니다', async () => {
      const result = await service.countUniqueWishlistUsers('123');
      expect(result).toBe(5);
    });
  });
});

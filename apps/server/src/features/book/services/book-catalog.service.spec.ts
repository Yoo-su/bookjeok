import { Test, TestingModule } from '@nestjs/testing';

import {
  BOOK_DETAIL_PROVIDERS,
  BOOK_SEARCH_PROVIDERS,
  BookCatalogProviderKind,
} from '../providers/book-catalog.types';
import { BookCatalogService } from './book-catalog.service';

const book = (isbn: string) => ({
  isbn,
  title: 't',
  author: 'a',
  publisher: 'p',
  description: 'd',
  image: 'i',
  discount: '0',
});

/** 목의 메서드를 `jest.Mock` 속성으로 잡아야 unbound-method 규칙에 걸리지 않는다. */
interface MockProvider {
  name: string;
  kind: BookCatalogProviderKind;
  search: jest.Mock;
  findByIsbn: jest.Mock;
}

const makeProvider = (
  name: string,
  kind: BookCatalogProviderKind = 'external',
): MockProvider => ({
  name,
  kind,
  search: jest.fn(),
  findByIsbn: jest.fn(),
});

describe('BookCatalogService', () => {
  let service: BookCatalogService;
  let primary: MockProvider;
  let fallback: MockProvider;

  beforeEach(async () => {
    primary = makeProvider('primary');
    fallback = makeProvider('fallback');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookCatalogService,
        { provide: BOOK_SEARCH_PROVIDERS, useValue: [primary, fallback] },
        { provide: BOOK_DETAIL_PROVIDERS, useValue: [primary, fallback] },
      ],
    }).compile();

    service = module.get(BookCatalogService);
  });

  describe('search', () => {
    it('앞선 공급처가 결과를 주면 뒤는 호출하지 않는다', async () => {
      primary.search.mockResolvedValue({
        total: 1,
        start: 1,
        display: 10,
        items: [book('1')],
      });

      const result = await service.search({ query: '데미안' });

      expect(result.items).toHaveLength(1);
      expect(fallback.search).not.toHaveBeenCalled();
    });

    it('앞선 공급처가 던지면 다음 공급처로 넘어간다', async () => {
      primary.search.mockRejectedValue(new Error('공급처 장애'));
      fallback.search.mockResolvedValue({
        total: 1,
        start: 1,
        display: 10,
        items: [book('2')],
      });

      const result = await service.search({ query: '데미안' });

      expect(result.items[0].isbn).toBe('2');
    });

    it('모든 공급처가 던지면 예외를 전파한다', async () => {
      primary.search.mockRejectedValue(new Error('1번 장애'));
      fallback.search.mockRejectedValue(new Error('2번 장애'));

      await expect(service.search({ query: '데미안' })).rejects.toThrow(
        '2번 장애',
      );
    });

    it('정상 응답이 하나라도 있으면 결과가 비어도 예외로 만들지 않는다', async () => {
      // 장애를 "책 없음"으로 둔갑시키지 않되, 그 반대도 하지 않아야 한다.
      primary.search.mockResolvedValue({
        total: 0,
        start: 1,
        display: 10,
        items: [],
      });
      fallback.search.mockRejectedValue(new Error('뒤쪽 장애'));

      const result = await service.search({ query: '없는책' });

      expect(result.items).toEqual([]);
    });

    it('누락된 파라미터를 기본값으로 채워 공급처에 넘긴다', async () => {
      primary.search.mockResolvedValue({
        total: 0,
        start: 1,
        display: 10,
        items: [book('3')],
      });

      await service.search({ query: '데미안' });

      expect(primary.search).toHaveBeenCalledWith({
        query: '데미안',
        display: 10,
        start: 1,
        sort: 'sim',
        field: 'Keyword',
        discovery: true,
      });
    });
  });

  describe('findByIsbn', () => {
    it('앞선 공급처가 못 찾으면 다음 공급처에서 찾는다', async () => {
      primary.findByIsbn.mockResolvedValue(null);
      fallback.findByIsbn.mockResolvedValue(book('9788932925554'));

      const result = await service.findByIsbn('9788932925554');

      expect(result?.isbn).toBe('9788932925554');
    });

    it('아무도 못 찾으면 null을 반환한다', async () => {
      primary.findByIsbn.mockResolvedValue(null);
      fallback.findByIsbn.mockResolvedValue(null);

      await expect(service.findByIsbn('없음')).resolves.toBeNull();
    });
  });

  describe('경로별 체인 분리', () => {
    /** 검색과 상세는 순서가 반대라, 한 배열로 되돌리면 둘 중 하나가 손해를 본다. */
    it('검색과 상세가 서로 다른 체인을 쓴다', async () => {
      const searchOnly = makeProvider('search-only');
      const detailOnly = makeProvider('detail-only');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BookCatalogService,
          { provide: BOOK_SEARCH_PROVIDERS, useValue: [searchOnly] },
          { provide: BOOK_DETAIL_PROVIDERS, useValue: [detailOnly] },
        ],
      }).compile();
      const split = module.get(BookCatalogService);

      searchOnly.search.mockResolvedValue({
        total: 1,
        start: 1,
        display: 10,
        items: [book('1')],
      });
      detailOnly.findByIsbn.mockResolvedValue(book('2'));

      await split.search({ query: '데미안' });
      await split.findByIsbn('2');

      expect(searchOnly.search).toHaveBeenCalled();
      expect(searchOnly.findByIsbn).not.toHaveBeenCalled();
      expect(detailOnly.findByIsbn).toHaveBeenCalled();
      expect(detailOnly.search).not.toHaveBeenCalled();
    });
  });

  describe('장애와 "책 없음"의 구분', () => {
    /** 자체 DB는 못 찾아도 예외를 던지지 않아, 판정에 넣으면 장애가 404로 둔갑한다. */
    const build = async (providers: MockProvider[]) => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BookCatalogService,
          { provide: BOOK_SEARCH_PROVIDERS, useValue: providers },
          { provide: BOOK_DETAIL_PROVIDERS, useValue: providers },
        ],
      }).compile();
      return module.get<BookCatalogService>(BookCatalogService);
    };

    it('외부가 전부 죽고 자체 DB가 못 찾으면 예외를 던진다', async () => {
      const external = makeProvider('external');
      const localDb = makeProvider('local-db', 'local');
      external.findByIsbn.mockRejectedValue(new Error('공급처 장애'));
      localDb.findByIsbn.mockResolvedValue(null); // 자체 DB는 조용히 null

      const svc = await build([external, localDb]);

      await expect(svc.findByIsbn('9788932925554')).rejects.toThrow(
        '공급처 장애',
      );
    });

    it('검색도 마찬가지로 장애를 빈 결과로 감추지 않는다', async () => {
      const external = makeProvider('external');
      const localDb = makeProvider('local-db', 'local');
      external.search.mockRejectedValue(new Error('공급처 장애'));
      localDb.search.mockResolvedValue({
        total: 0,
        start: 1,
        display: 10,
        items: [],
      });

      const svc = await build([external, localDb]);

      await expect(svc.search({ query: '데미안' })).rejects.toThrow(
        '공급처 장애',
      );
    });

    it('외부가 정상 응답했다면 빈 결과는 장애가 아니라 사실이다', async () => {
      const external = makeProvider('external');
      const localDb = makeProvider('local-db', 'local');
      external.findByIsbn.mockResolvedValue(null);
      localDb.findByIsbn.mockResolvedValue(null);

      const svc = await build([external, localDb]);

      await expect(svc.findByIsbn('없는책')).resolves.toBeNull();
    });

    it('자체 DB 단독 구성에서는 자체 DB의 "없음"이 사실로 인정된다', async () => {
      // 알라딘 제거 후 외부 공급처가 없는 구성. 우리가 가진 것이 곧 전부다.
      const localDb = makeProvider('local-db', 'local');
      localDb.findByIsbn.mockResolvedValue(null);

      const svc = await build([localDb]);

      await expect(svc.findByIsbn('없는책')).resolves.toBeNull();
    });

    it('자체 DB 단독 구성에서 그 자체 DB가 죽으면 예외를 던진다', async () => {
      const localDb = makeProvider('local-db', 'local');
      localDb.findByIsbn.mockRejectedValue(new Error('DB 장애'));

      const svc = await build([localDb]);

      await expect(svc.findByIsbn('9788932925554')).rejects.toThrow('DB 장애');
    });
  });
});

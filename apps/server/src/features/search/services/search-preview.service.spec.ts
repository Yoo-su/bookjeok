import { DataSource } from 'typeorm';

import { BookCatalogService } from '@/features/book/services/book-catalog.service';

import { SearchPreviewService } from './search-preview.service';

const book = (isbn: string) => ({
  isbn,
  title: `책 ${isbn}`,
  author: '한강',
  publisher: '창비',
  description: '',
  image: '',
  discount: '0',
});

describe('SearchPreviewService', () => {
  const search = jest.fn();
  const query = jest.fn();
  const service = new SearchPreviewService(
    { search } as unknown as BookCatalogService,
    { query } as unknown as DataSource,
  );

  beforeEach(() => {
    search.mockReset();
    query.mockReset();
  });

  it('두 글자 미만이면 DB를 부르지 않는다', async () => {
    for (const q of ['', '한', '  한  ', '%_ ,']) {
      const result = await service.preview(q);
      expect(
        result.books.total + result.reviews.total + result.sales.total,
      ).toBe(0);
    }
    expect(search).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('도서는 소개 검색 없이 4권만 찾고 책별 리뷰·중고 수를 붙인다', async () => {
    search.mockResolvedValue({
      total: 9,
      start: 1,
      display: 4,
      items: [book('a'), book('b')],
    });
    query.mockImplementation((sql: string) => {
      if (sql.includes('UNION ALL')) {
        return Promise.resolve([
          { isbn: 'a', kind: 'review', count: 2 },
          { isbn: 'a', kind: 'sale', count: 1 },
        ]);
      }
      if (sql.includes('FROM reviews r')) {
        return Promise.resolve([
          {
            id: '7',
            title: '리뷰',
            rating: '4.5',
            nickname: '새벽',
            bookTitle: '책 a',
            body: '<p>한강의 문장</p>',
            total: '5',
          },
        ]);
      }
      return Promise.resolve([
        {
          id: '3',
          title: '팝니다',
          price: '9000',
          status: 'RESERVED',
          city: '서울',
          district: '마포구',
          bookTitle: '책 a',
          image: '',
          total: '1',
        },
      ]);
    });

    const result = await service.preview(' 한강 ');

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ query: '한강', display: 4, discovery: false }),
    );
    expect(result.books).toEqual({
      total: 9,
      items: [
        expect.objectContaining({
          isbn: 'a',
          image: null,
          reviewCount: 2,
          saleCount: 1,
        }),
        expect.objectContaining({ isbn: 'b', reviewCount: 0, saleCount: 0 }),
      ],
    });
    expect(result.reviews).toEqual({
      total: 5,
      items: [
        {
          id: 7,
          title: '리뷰',
          snippet: '한강의 문장',
          rating: 4.5,
          nickname: '새벽',
          bookTitle: '책 a',
        },
      ],
    });
    expect(result.sales).toEqual({
      total: 1,
      items: [
        {
          id: 3,
          title: '팝니다',
          price: 9000,
          status: 'RESERVED',
          image: null,
          bookTitle: '책 a',
          region: '서울 마포구',
        },
      ],
    });
  });

  it('도서가 없으면 책별 수를 세지 않는다', async () => {
    search.mockResolvedValue({ total: 0, start: 1, display: 4, items: [] });
    query.mockResolvedValue([]);
    const result = await service.preview('없는책');
    expect(result.books).toEqual({ items: [], total: 0 });
    expect(query).toHaveBeenCalledTimes(2);
  });
});

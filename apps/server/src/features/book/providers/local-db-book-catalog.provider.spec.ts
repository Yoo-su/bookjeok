import { Repository } from 'typeorm';

import { Book } from '../entities/book.entity';
import { LocalDbBookCatalogProvider } from './local-db-book-catalog.provider';

describe('LocalDbBookCatalogProvider', () => {
  describe('search', () => {
    const book = (isbn: string) =>
      ({ isbn, title: isbn, author: '', publisher: '' }) as Book;

    /** query는 SQL 첫머리로 무엇을 돌려줄지 고른다. findBy는 순서를 뒤섞어 돌려준다. */
    function providerWith(
      respond: (sql: string) => unknown[],
      books: Book[] = [],
    ) {
      const repo = {
        query: jest.fn((sql: string, _params: unknown[]) =>
          Promise.resolve(respond(sql)),
        ),
        findBy: jest.fn(() => Promise.resolve([...books].reverse())),
        findOneBy: jest.fn(({ isbn }: { isbn: string }) =>
          Promise.resolve(books.find((item) => item.isbn === isbn) ?? null),
        ),
      };
      return {
        repo,
        provider: new LocalDbBookCatalogProvider(
          repo as unknown as Repository<Book>,
        ),
      };
    }

    const params = (query: string, start = 1) => ({
      query,
      display: 10,
      start,
      field: 'Keyword' as const,
      sort: 'sim' as const,
    });

    it('순위 쿼리의 순서대로 상세를 돌려주고 건수는 창 함수 값을 쓴다', async () => {
      const { provider } = providerWith(
        () => [
          { isbn: 'b', total: '42' },
          { isbn: 'a', total: '42' },
        ],
        [book('a'), book('b')],
      );

      const result = await provider.search(params('사랑'));

      expect(result.total).toBe(42);
      expect(result.items.map((item) => item.isbn)).toEqual(['b', 'a']);
    });

    it('공백·기호뿐인 검색어는 질의하지 않는다', async () => {
      const { repo, provider } = providerWith(() => []);

      for (const query of ['   ', '!!! -']) {
        const result = await provider.search(params(query));
        expect(result.total).toBe(0);
      }
      expect(repo.query).not.toHaveBeenCalled();
    });

    /** "해리 포터"는 붙여 쓴 형태가 있으면 인덱스 한 번으로 끝낸다. */
    it('짧은 단어 여러 개는 붙여 쓴 형태부터 확인한다', async () => {
      const { repo, provider } = providerWith((sql) =>
        sql.startsWith('SELECT 1') ? [{}] : [],
      );

      await provider.search(params('해리 포터'));

      const [probeSql, probeParams] = repo.query.mock.calls[0];
      expect(probeSql).toMatch(/^SELECT 1 FROM books/);
      expect(probeParams).toEqual(['%해리포터%']);
      const [pageSql, pageParams] = repo.query.mock.calls[1];
      expect(pageSql).not.toContain('ILIKE');
      expect(pageParams[0]).toBe('%해리포터%');
    });

    it('붙여 쓴 형태가 없으면 단어별로 찾는다', async () => {
      const { repo, provider } = providerWith(() => []);

      await provider.search(params('한강 소년'));

      const [pageSql] = repo.query.mock.calls[1];
      expect(pageSql).toContain('ILIKE $1');
      expect(pageSql).toContain('ILIKE $2');
    });

    it('긴 단어가 있으면 붙여 쓰기 확인을 건너뛴다', async () => {
      const { repo, provider } = providerWith(() => []);

      await provider.search(params('라슬로 사탄'));

      expect(repo.query).toHaveBeenCalledTimes(1);
    });

    it('마지막 페이지를 넘기면 건수만 따로 센다', async () => {
      const { repo, provider } = providerWith((sql) =>
        sql.startsWith('SELECT count') ? [{ total: '7' }] : [],
      );

      const result = await provider.search(params('채식주의자', 21));

      expect(result).toMatchObject({ total: 7, items: [] });
      expect(repo.findBy).not.toHaveBeenCalled();
    });

    it('첫 페이지가 비면 건수 쿼리 없이 0이다', async () => {
      const { repo, provider } = providerWith(() => []);

      const result = await provider.search(params('없는책제목'));

      expect(result.total).toBe(0);
      expect(repo.query).toHaveBeenCalledTimes(1);
    });

    it('ISBN 후보를 기존 서지 검색에 합치고 페이지 밖에서도 합친 건수를 유지한다', async () => {
      const isbn = '9788936434595';
      const { repo, provider } = providerWith(
        (sql) =>
          sql.startsWith('SELECT count')
            ? [{ total: '2' }]
            : [{ isbn, total: '2' }],
        [book(isbn)],
      );
      expect(
        (await provider.search(params('978-89-364-3459-5'))).items[0].isbn,
      ).toBe(isbn);
      expect(repo.query.mock.calls[0][0]).toContain('UNION');
      expect(repo.query.mock.calls[0][1]).toContain(isbn);
      expect(repo.findOneBy).not.toHaveBeenCalled();
      repo.query.mockImplementation((sql: string) =>
        Promise.resolve(sql.startsWith('SELECT count') ? [{ total: '2' }] : []),
      );
      expect(await provider.search(params(isbn, 11))).toMatchObject({
        total: 2,
        items: [],
      });
      expect(repo.query.mock.calls.at(-1)?.[1]).toContain(isbn);
    });

    it('유효한 인덱스를 확인한 경우에만 소개 검색 SQL을 실행한다', async () => {
      const { provider, repo } = providerWith((sql) =>
        sql.startsWith('SELECT EXISTS') ? [{ ready: true }] : [],
      );
      await provider.onModuleInit();
      await provider.search(params('인공지능 윤리'));
      expect(repo.query.mock.calls[1][0]).toContain("to_tsvector('simple'");
    });

    it('인덱스가 없으면 소개를 풀스캔하지 않고 서지 확장만 실행한다', async () => {
      const { provider, repo } = providerWith((sql) =>
        sql.startsWith('SELECT EXISTS') ? [{ ready: false }] : [],
      );
      await provider.onModuleInit();
      await provider.search(params('불안을 다루는 심리학 책'));
      expect(repo.query.mock.calls[1][0]).not.toContain('to_tsvector');
      expect(repo.query.mock.calls[1][1]).toContain('%불안%');
    });
  });

  describe('toBookInfo 매핑', () => {
    /**
     * 엔티티는 `pubDate`, 계약(`BookInfo`)은 `pubdate`다. 이 매핑이 빠져 있어
     * 위시리스트와 리뷰 상세의 출간일이 계속 비어 있었다.
     */
    function providerReturning(book: Partial<Book>) {
      const repo = {
        findOneBy: jest.fn().mockResolvedValue(book),
      } as unknown as Repository<Book>;

      return new LocalDbBookCatalogProvider(repo);
    }

    const baseBook: Partial<Book> = {
      isbn: '9788901234567',
      title: '채식주의자',
      author: '한강',
      publisher: '창비',
      description: '',
      image: 'https://cdn.bookjeok.com/covers/9788901234567.jpg',
      discount: '15000',
    };

    it('출간일을 pubdate로 옮긴다', async () => {
      const provider = providerReturning({
        ...baseBook,
        pubDate: '2007-10-30',
      });

      const result = await provider.findByIsbn('9788901234567');

      // 하루 밀리거나 타임스탬프로 바뀌면 안 된다. 달력 날짜 그대로다.
      expect(result?.pubdate).toBe('2007-10-30');
    });

    it('출간일이 없으면 undefined로 둔다', async () => {
      const provider = providerReturning({ ...baseBook, pubDate: null });

      const result = await provider.findByIsbn('9788901234567');

      expect(result?.pubdate).toBeUndefined();
    });

    it('없는 ISBN은 null을 돌려준다', async () => {
      const repo = {
        findOneBy: jest.fn().mockResolvedValue(null),
      } as unknown as Repository<Book>;

      const provider = new LocalDbBookCatalogProvider(repo);

      expect(await provider.findByIsbn('0000000000000')).toBeNull();
    });
  });
});

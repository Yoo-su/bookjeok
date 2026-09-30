import { join } from 'path';
import { DataSource, In, ObjectLiteral, UpdateQueryBuilder } from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { Comment } from '@/features/comment/entities/comment.entity';
import { Review } from '@/features/review/entities/review.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { adjustCounter } from './adjust-counter';

// DB에 붙지 않고 실제 엔티티 메타데이터로 TypeORM이 만드는 SQL만 확인한다.
describe('adjustCounter', () => {
  let dataSource: DataSource;
  let executed: [string, unknown[]][];

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      entities: [join(__dirname, '../../features/**/*.entity.ts')],
    });
    // initialize()는 접속까지 하므로 메타데이터만 만든다.
    await (
      dataSource as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();
  });

  beforeEach(() => {
    executed = [];
    jest
      .spyOn(UpdateQueryBuilder.prototype, 'execute')
      .mockImplementation(function (this: UpdateQueryBuilder<ObjectLiteral>) {
        executed.push(this.getQueryAndParameters());
        return Promise.resolve({ raw: [], affected: 1, generatedMaps: [] });
      });
  });

  afterEach(() => jest.restoreAllMocks());

  it('TypeORM increment는 updatedAt을 CURRENT_TIMESTAMP로 갱신한다 (회귀 기준)', async () => {
    await dataSource.manager.increment(UsedBookSale, { id: 1 }, 'viewCount', 1);

    expect(executed[0][0]).toContain('"updatedAt" = CURRENT_TIMESTAMP');
  });

  it.each([
    { name: 'UsedBookSale', entity: UsedBookSale, column: 'viewCount' },
    { name: 'Review', entity: Review, column: 'viewCount' },
    { name: 'Review', entity: Review, column: 'reactionCount' },
    { name: 'Comment', entity: Comment, column: 'likeCount' },
  ] as const)(
    '$name $column 증가는 updatedAt을 보존한다',
    async ({ entity, column }) => {
      await adjustCounter<ObjectLiteral>(
        dataSource.manager,
        entity,
        { id: 7 },
        column,
        1,
      );

      const [sql, params] = executed[0];
      expect(sql).toContain(`"${column}" = "${column}" + 1`);
      expect(sql).toContain('"updatedAt" = "updatedAt"');
      expect(sql).not.toContain('CURRENT_TIMESTAMP');
      expect(params).toEqual([7]);
    },
  );

  it('도서는 isbn 조건으로 조회수를 올린다', async () => {
    await adjustCounter(
      dataSource.manager,
      Book,
      { isbn: '9788936434120' },
      'viewCount',
      1,
    );

    const [sql, params] = executed[0];
    expect(sql).toContain('"viewCount" = "viewCount" + 1');
    expect(sql).not.toContain('CURRENT_TIMESTAMP');
    expect(params).toEqual(['9788936434120']);
  });

  it('음수 delta는 감소식으로 만들고 In 조건을 지원한다', async () => {
    await adjustCounter(
      dataSource.manager,
      Comment,
      { id: In([1, 2]) },
      'likeCount',
      -1,
    );

    const [sql, params] = executed[0];
    expect(sql).toContain('"likeCount" = "likeCount" - 1');
    expect(sql).not.toContain('CURRENT_TIMESTAMP');
    expect(params).toEqual([1, 2]);
  });

  it('정수가 아닌 delta나 없는 컬럼은 거부한다', async () => {
    await expect(
      adjustCounter(dataSource.manager, Review, { id: 1 }, 'viewCount', 0.5),
    ).rejects.toThrow('not an integer');
    await expect(
      adjustCounter(
        dataSource.manager,
        Review,
        { id: 1 },
        'nope' as 'viewCount',
        1,
      ),
    ).rejects.toThrow('was not found');
    expect(executed).toHaveLength(0);
  });
});

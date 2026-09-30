import {
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
  TypeORMError,
} from 'typeorm';

/**
 * 조회수·반응수 같은 카운터 컬럼을 증감합니다. `@UpdateDateColumn`은 그대로 둡니다.
 *
 * TypeORM의 `increment`/`decrement`는 수정일 컬럼을 `CURRENT_TIMESTAMP`로 함께 갱신해서,
 * 누가 글을 보기만 해도 "방금 수정됨"이 되고 sitemap·JSON-LD의 수정일도 밀립니다.
 * 수정일 컬럼을 자기 자신으로 대입하면 TypeORM이 자동 갱신을 붙이지 않습니다.
 * @param manager 트랜잭션 안이면 그 EntityManager, 아니면 `repository.manager`
 * @param target 엔티티 클래스
 * @param where 대상 행 조건
 * @param column 카운터 컬럼의 프로퍼티명
 * @param delta 증감량 (음수면 감소)
 */
export async function adjustCounter<T extends ObjectLiteral>(
  manager: EntityManager,
  target: EntityTarget<T>,
  where: FindOptionsWhere<T>,
  column: keyof T & string,
  delta: number,
): Promise<void> {
  if (!Number.isInteger(delta)) {
    throw new TypeORMError(`Counter delta "${delta}" is not an integer.`);
  }

  const metadata = manager.connection.getMetadata(target);
  const counter = metadata.findColumnWithPropertyPath(column);
  if (!counter) {
    throw new TypeORMError(
      `Column ${column} was not found in ${metadata.targetName} entity.`,
    );
  }

  const escape = (name: string) => manager.connection.driver.escape(name);
  const operator = delta < 0 ? '-' : '+';
  const values: Record<string, () => string> = {
    [column]: () =>
      `${escape(counter.databaseName)} ${operator} ${Math.abs(delta)}`,
  };

  const updateDate = metadata.updateDateColumn;
  if (updateDate) {
    values[updateDate.propertyName] = () => escape(updateDate.databaseName);
  }

  await manager
    .createQueryBuilder(target, 'entity')
    .update(target)
    .set(values)
    .where(where)
    .execute();
}

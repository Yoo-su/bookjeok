import { HttpStatus } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

import { BusinessException } from '@/shared/exceptions';

import {
  BookSaleSortBy,
  QueryBookSaleDto,
  SortOrder,
} from '../dtos/query-book-sale.dto';
import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';

export const applyCommonFilters = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  queryDto: QueryBookSaleDto,
) => {
  const { search, city, district, minPrice, maxPrice, status } = queryDto;

  if (search) {
    // ILIKE를 쓴다. Postgres의 LIKE는 대소문자를 가려서 "Clean Code"로 등록된
    // 판매글이 "clean code" 검색에 걸리지 않는다.
    queryBuilder.andWhere(
      '(sale.title ILIKE :search OR sale.content ILIKE :search OR book.title ILIKE :search OR book.author ILIKE :search)',
      { search: `%${search}%` },
    );
  }

  if (city) {
    queryBuilder.andWhere('sale.city = :city', { city });
  }
  if (district) {
    queryBuilder.andWhere('sale.district = :district', { district });
  }

  if (minPrice !== undefined) {
    queryBuilder.andWhere('sale.price >= :minPrice', { minPrice });
  }
  if (maxPrice !== undefined) {
    queryBuilder.andWhere('sale.price <= :maxPrice', { maxPrice });
  }

  if (status && status.length > 0) {
    const statusArray = Array.isArray(status) ? status : [status];
    queryBuilder.andWhere('sale.status IN (:...status)', {
      status: statusArray,
    });
  } else {
    queryBuilder.andWhere('sale.status != :withdrawnStatus', {
      withdrawnStatus: SaleStatus.WITHDRAWN,
    });
  }
};

export const applyLocationFilter = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  queryDto: QueryBookSaleDto,
) => {
  const { lat, lng, radius } = queryDto;

  if (lat && lng) {
    const searchRadius = radius || 5000;

    queryBuilder.addSelect(
      'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(sale.latitude, sale.longitude))',
      'distance',
    );

    // GiST 인덱스(used_book_sales_location_idx)는 `earth_box(...) @> ll_to_earth(...)`
    // 형태만 받는다. `earth_distance(...) <= r`은 인덱스 조건으로 변환되지 않아
    // 지금까지 매번 전체 스캔이었고, 인덱스는 만들어진 이래 한 번도 쓰이지 않았다.
    //
    // earth_box는 반지름의 외접 정육면체라 모서리 쪽이 더 딸려온다. 그래서 아래
    // 정확한 거리 조건을 그대로 남긴다. 두 조건을 함께 걸면 결과 집합은 전과
    // 완전히 같고, 인덱스가 후보를 먼저 줄여줄 뿐이다.
    queryBuilder.andWhere(
      'earth_box(ll_to_earth(:lat, :lng), :radius) @> ll_to_earth(sale.latitude, sale.longitude)',
      { lat, lng, radius: searchRadius },
    );

    queryBuilder.andWhere(
      'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(sale.latitude, sale.longitude)) <= :radius',
      { lat, lng, radius: searchRadius },
    );
  }
};

export const applySorting = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  sortBy: BookSaleSortBy,
  sortOrder: 'ASC' | 'DESC',
  lat?: number,
  lng?: number,
) => {
  if (lat && lng && sortBy === BookSaleSortBy.DISTANCE) {
    queryBuilder.orderBy('distance', 'ASC');
  } else if (sortBy !== BookSaleSortBy.DISTANCE) {
    // 기본 정렬
    queryBuilder.orderBy(`sale.${sortBy}`, sortOrder);
  }
  // 2차 정렬: ID 역순 (최신순) - 동률 처리 및 커서 기반 페이지네이션의 안정성 확보
  queryBuilder.addOrderBy('sale.id', 'DESC');
};

export interface CursorData {
  value: string | number;
  id: number;
}

export const decodeCursor = (cursor: string): CursorData => {
  // 커서는 클라이언트가 그대로 되돌려주는 값이라 조작되거나 낡을 수 있다.
  // 평범한 Error를 던지면 전역 필터가 500으로 처리하므로 400으로 내린다.
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(json) as CursorData;

    if (
      typeof parsed?.id !== 'number' ||
      !Number.isInteger(parsed.id) ||
      (typeof parsed.value !== 'number' && typeof parsed.value !== 'string')
    ) {
      throw new Error('malformed cursor payload');
    }

    return parsed;
  } catch {
    throw new BusinessException('SALE_INVALID_CURSOR', HttpStatus.BAD_REQUEST);
  }
};

export const encodeCursor = (data: CursorData): string => {
  return Buffer.from(JSON.stringify(data)).toString('base64');
};

export const applyCursorFilter = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  queryDto: QueryBookSaleDto,
) => {
  const {
    cursor,
    sortBy = BookSaleSortBy.CREATED_AT,
    sortOrder = 'DESC',
    lat,
    lng,
  } = queryDto;

  if (!cursor) return;

  const cursorData = decodeCursor(cursor);
  const { value, id } = cursorData;

  // CREATED_AT의 경우 ID 기반 비교 사용 (ID가 생성 시간 순서와 일치)
  if (sortBy === BookSaleSortBy.CREATED_AT) {
    const operator = sortOrder === SortOrder.ASC ? '>' : '<';
    queryBuilder.andWhere(`sale.id ${operator} :cursorId`, { cursorId: id });
    return;
  }

  // DISTANCE의 경우 lat/lng가 필수
  if (sortBy === BookSaleSortBy.DISTANCE) {
    if (!lat || !lng) {
      // lat/lng가 없으면 거리순 커서 사용 불가, ID 기반 fallback
      queryBuilder.andWhere('sale.id < :cursorId', { cursorId: id });
      return;
    }
    // 거리순은 전체 earth_distance 표현식 사용 (별칭이 WHERE에서 사용 불가)
    const distanceExpr =
      'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(sale.latitude, sale.longitude))';
    queryBuilder.andWhere(
      `(${distanceExpr} > :cursorValue OR (${distanceExpr} = :cursorValue AND sale.id < :cursorId))`,
      { cursorValue: value, cursorId: id, lat, lng },
    );
    return;
  }

  // PRICE 정렬
  const column = `sale.${sortBy}`;
  const operator = sortOrder === 'DESC' ? '<' : '>';

  queryBuilder.andWhere(
    `(${column} ${operator} :cursorValue OR (${column} = :cursorValue AND sale.id < :cursorId))`,
    { cursorValue: value, cursorId: id },
  );
};

import { SelectQueryBuilder } from 'typeorm';
import { BookSaleSortBy, QueryBookSaleDto } from '../dtos/query-book-sale.dto';
import { UsedBookSale } from '../entities/used-book-sale.entity';

export const applyCommonFilters = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  queryDto: QueryBookSaleDto,
) => {
  const { search, city, district, minPrice, maxPrice, status } = queryDto;

  if (search) {
    queryBuilder.andWhere(
      '(sale.title LIKE :search OR sale.content LIKE :search OR book.title LIKE :search OR book.author LIKE :search)',
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
    queryBuilder.orderBy(`sale.${sortBy}`, sortOrder);
  }
};

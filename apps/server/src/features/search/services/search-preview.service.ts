import {
  SEARCH_PREVIEW_LIMITS,
  SEARCH_PREVIEW_MIN_LENGTH,
  SearchPreview,
  SearchPreviewBook,
  SearchPreviewReview,
  SearchPreviewSale,
} from '@bookjeok/core';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { BookCatalogService } from '@/features/book/services/book-catalog.service';

import {
  buildBookActivityQuery,
  buildReviewPreviewQuery,
  buildSalePreviewQuery,
  buildSnippet,
  previewTerms,
} from '../utils/search-preview-sql';

interface ReviewRow {
  id: number;
  title: string;
  rating: number;
  nickname: string;
  bookTitle: string;
  body: string;
  total: string;
}

interface SaleRow {
  id: number;
  title: string;
  price: number;
  status: 'FOR_SALE' | 'RESERVED';
  city: string | null;
  district: string | null;
  bookTitle: string;
  image: string | null;
  total: string;
}

interface ActivityRow {
  isbn: string;
  kind: 'review' | 'sale';
  count: number;
}

const EMPTY: SearchPreview = {
  books: { items: [], total: 0 },
  reviews: { items: [], total: 0 },
  sales: { items: [], total: 0 },
};

/**
 * 상단바 통합 검색 미리보기. 입력 중에 부르므로 가볍게 유지한다.
 * - 도서: 도서 검색과 같은 서지 관련도 경로에서 소개 전문검색만 끈다
 * - 리뷰·판매글: 단어별 AND + 필드 가중치 정렬. 지금 규모에선 인덱스 없이 훑는 게 가장 싸다
 */
@Injectable()
export class SearchPreviewService {
  constructor(
    private readonly bookCatalogService: BookCatalogService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async preview(rawQuery: string): Promise<SearchPreview> {
    const query = rawQuery.trim();
    const terms = previewTerms(query);
    const length = [...terms.join('')].length;
    if (terms.length === 0 || length < SEARCH_PREVIEW_MIN_LENGTH) return EMPTY;

    const [books, reviews, sales] = await Promise.all([
      this.searchBooks(query),
      this.searchReviews(terms),
      this.searchSales(terms),
    ]);
    return { books, reviews, sales };
  }

  private async searchBooks(query: string) {
    const result = await this.bookCatalogService.search({
      query,
      display: SEARCH_PREVIEW_LIMITS.books,
      start: 1,
      sort: 'sim',
      field: 'Keyword',
      discovery: false,
    });
    const activity = await this.countActivity(
      result.items.map((book) => book.isbn),
    );
    const items: SearchPreviewBook[] = result.items.map((book) => ({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      image: book.image || null,
      reviewCount: activity.get(`review:${book.isbn}`) ?? 0,
      saleCount: activity.get(`sale:${book.isbn}`) ?? 0,
    }));
    return { items, total: result.total };
  }

  private async countActivity(isbns: string[]) {
    const counts = new Map<string, number>();
    if (isbns.length === 0) return counts;
    const { sql, params } = buildBookActivityQuery(isbns);
    const rows: ActivityRow[] = await this.dataSource.query(sql, params);
    for (const row of rows) {
      counts.set(`${row.kind}:${row.isbn}`, Number(row.count));
    }
    return counts;
  }

  private async searchReviews(terms: string[]) {
    const { sql, params } = buildReviewPreviewQuery(
      terms,
      SEARCH_PREVIEW_LIMITS.reviews,
    );
    const rows: ReviewRow[] = await this.dataSource.query(sql, params);
    const items: SearchPreviewReview[] = rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      snippet: buildSnippet(row.body, terms),
      rating: Number(row.rating),
      nickname: row.nickname,
      bookTitle: row.bookTitle,
    }));
    return { items, total: Number(rows[0]?.total ?? 0) };
  }

  private async searchSales(terms: string[]) {
    const { sql, params } = buildSalePreviewQuery(
      terms,
      SEARCH_PREVIEW_LIMITS.sales,
    );
    const rows: SaleRow[] = await this.dataSource.query(sql, params);
    const items: SearchPreviewSale[] = rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      price: Number(row.price),
      status: row.status,
      image: row.image || null,
      bookTitle: row.bookTitle,
      region: [row.city, row.district].filter(Boolean).join(' ') || null,
    }));
    return { items, total: Number(rows[0]?.total ?? 0) };
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Book } from '../entities/book.entity';
import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';
import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { BookInfoDto } from '../dtos/book-info.dto';
import { UserService } from '../../user/services/user.service';
import { GetBookSalesQueryDto } from '../dtos/get-book-sales-query.dto';
import { UpdateBookSaleDto } from '../dtos/update-book-sale.dto';
import { QueryBookSaleDto } from '../dtos/query-book-sale.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 책 정보가 DB에 있으면 찾고, 없으면 새로 생성합니다.
   * @param bookInfoDto 책 정보 DTO
   * @returns 책 엔티티
   */
  private async findOrCreateBook(bookInfoDto: BookInfoDto): Promise<Book> {
    let book = await this.bookRepository.findOneBy({ isbn: bookInfoDto.isbn });
    if (!book) {
      book = this.bookRepository.create(bookInfoDto);
      await this.bookRepository.save(book);
    }
    return book;
  }

  /**
   * 중고책 판매글을 생성합니다.
   * @param createBookSaleDto 판매글 생성 DTO
   * @param userId 작성자 ID
   * @returns 생성된 판매글
   */
  async createUsedBookSale(
    createBookSaleDto: CreateBookSaleDto,
    userId: number,
  ): Promise<UsedBookSale> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. 책 정보 찾기 또는 생성 (트랜잭션 내에서 처리)
      let book = await manager.findOne(Book, {
        where: { isbn: createBookSaleDto.book.isbn },
      });

      if (!book) {
        book = manager.create(Book, createBookSaleDto.book);
        book = await manager.save(Book, book);
      }

      // 2. 판매글 생성
      const newSale = manager.create(UsedBookSale, {
        ...createBookSaleDto,
        user,
        book,
      });

      return manager.save(UsedBookSale, newSale);
    });
  }

  /**
   * 특정 판매글의 상태를 업데이트합니다.
   * @param saleId - 업데이트할 판매글 ID
   * @param userId - 요청을 보낸 사용자 ID (소유권 확인용)
   * @param status - 변경할 새로운 상태
   * @returns 업데이트된 판매글 정보
   */
  async updateSaleStatus(
    saleId: number,
    userId: number,
    status: SaleStatus,
  ): Promise<UsedBookSale> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'], // 소유권 확인을 위해 user 정보를 함께 조회
    });

    if (!sale) {
      throw new Error('판매글을 찾을 수 없습니다.');
    }

    // 판매글의 작성자와 현재 로그인한 사용자가 동일한지 확인
    if (sale.user.id !== userId) {
      throw new ForbiddenException('판매글을 수정할 권한이 없습니다.');
    }

    sale.status = status;
    return await this.usedBookSaleRepository.save(sale);
  }

  /**
   * 판매글 조회수를 증가시킵니다.
   * @param id 판매글 ID
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.usedBookSaleRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * ID로 판매글을 조회합니다.
   * @param id 판매글 ID
   * @returns 판매글 정보
   */
  async findSaleById(id: number) {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found.`);
    }
    return sale;
  }

  /**
   * 조건에 따라 판매글 목록을 검색합니다.
   * @param queryDto 검색 조건 DTO
   * @returns 판매글 목록 및 메타데이터
   */
  async searchSales(queryDto: QueryBookSaleDto) {
    const {
      page = 1,
      limit = 12,
      search,
      city,
      district,
      minPrice,
      maxPrice,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.book', 'book')
      .select([
        'sale.id',
        'sale.title',
        'sale.price',
        'sale.status',
        'sale.createdAt',
        'sale.updatedAt',
        'sale.imageUrls',
        'sale.city',
        'sale.district',
        'sale.viewCount',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
        'book',
      ]);

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere(
        '(sale.title LIKE :search OR sale.content LIKE :search OR book.title LIKE :search OR book.author LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 시/도, 시/군/구 필터
    if (city) {
      queryBuilder.andWhere('sale.city = :city', { city });
    }
    if (district) {
      queryBuilder.andWhere('sale.district = :district', { district });
    }

    // 가격대 필터
    if (minPrice !== undefined) {
      queryBuilder.andWhere('sale.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('sale.price <= :maxPrice', { maxPrice });
    }

    // 판매글 상태 필터
    if (status && status.length > 0) {
      // Defensively ensure 'status' is an array before passing to TypeORM
      const statusArray = Array.isArray(status) ? status : [status];
      queryBuilder.andWhere('sale.status IN (:...status)', {
        status: statusArray,
      });
    }

    // 정렬
    queryBuilder.orderBy(`sale.${sortBy}`, sortOrder);

    // 페이지네이션
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [sales, total] = await queryBuilder.getManyAndCount();

    const hasNextPage = page * limit < total;

    return {
      sales,
      total,
      page,
      limit,
      hasNextPage,
    };
  }

  /**
   * ISBN과 쿼리 옵션으로 판매글 목록을 조회하는 메서드
   */
  async findSalesByIsbn(isbn: string, queryDto: GetBookSalesQueryDto) {
    const { page, limit, city, district } = queryDto;

    const queryBuilder = this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .where('sale.bookIsbn = :isbn', { isbn })
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.book', 'book')
      .select([
        'sale.id',
        'sale.title',
        'sale.price',
        'sale.status',
        'sale.createdAt',
        'sale.updatedAt',
        'sale.imageUrls',
        'sale.city',
        'sale.district',
        'sale.viewCount',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
        'book', // book 객체 전체 선택
      ])
      .orderBy('sale.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // 지역 필터링 조건이 있을 경우 동적으로 추가
    if (city) {
      queryBuilder.andWhere('sale.city = :city', { city });
    }
    if (district) {
      queryBuilder.andWhere('sale.district = :district', { district });
    }

    const [sales, total] = await queryBuilder.getManyAndCount();

    const hasNextPage = page * limit < total;

    return {
      sales,
      total,
      page,
      hasNextPage,
    };
  }

  /**
   * 특정 판매글의 정보를 업데이트합니다.
   * @param saleId - 업데이트할 판매글 ID
   * @param userId - 요청을 보낸 사용자 ID (소유권 확인용)
   * @param updateBookSaleDto - 업데이트할 판매글 정보
   * @returns 업데이트된 판매글 정보
   */
  async updateUsedBookSale(
    saleId: number,
    userId: number,
    updateBookSaleDto: UpdateBookSaleDto,
  ): Promise<UsedBookSale> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'], // 소유권 확인을 위해 user 정보를 함께 조회
    });

    if (!sale) {
      throw new NotFoundException('판매글을 찾을 수 없습니다.');
    }

    if (sale.user.id !== userId) {
      throw new ForbiddenException('판매글을 수정할 권한이 없습니다.');
    }

    // DTO의 내용과 기존 판매글 데이터를 병합합니다.
    // DTO에 포함된 필드만 업데이트됩니다.
    const updatedSale = this.usedBookSaleRepository.merge(
      sale,
      updateBookSaleDto,
    );

    return await this.usedBookSaleRepository.save(updatedSale);
  }

  /**
   * 특정 판매글을 삭제합니다.
   * @param saleId - 삭제할 판매글 ID
   * @param userId - 요청을 보낸 사용자 ID (소유권 확인용)
   */
  async deleteUsedBookSale(saleId: number, userId: number): Promise<void> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'],
    });

    if (!sale) {
      throw new NotFoundException('판매글을 찾을 수 없습니다.');
    }

    if (sale.user.id !== userId) {
      throw new ForbiddenException('판매글을 삭제할 권한이 없습니다.');
    }

    await this.usedBookSaleRepository.remove(sale);
  }

  /**
   * 가장 최근에 등록된 중고책 판매글을 조회합니다. (최대 10개)
   */
  async findRecentSales(): Promise<UsedBookSale[]> {
    return await this.usedBookSaleRepository.find({
      where: { status: SaleStatus.FOR_SALE }, // 판매중인 판매글만 조회
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['user', 'book'], // 작성자, 책 정보 포함
    });
  }
  /**
   * 책 제목 또는 저자로 책을 검색합니다.
   * @param query - 검색어
   */
  async searchBooks(query: string): Promise<Book[]> {
    if (!query) {
      return [];
    }

    return await this.bookRepository
      .createQueryBuilder('book')
      .where('book.title LIKE :query OR book.author LIKE :query', {
        query: `%${query}%`,
      })
      .take(20) // 최대 20개까지만 조회
      .getMany();
  }
}

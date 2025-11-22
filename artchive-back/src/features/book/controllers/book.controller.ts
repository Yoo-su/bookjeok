import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  Get,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookService } from '../services/book.service';
import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { UpdateSaleStatusDto } from '../../user/dtos/update-sale-status.dto';
import { GetBookSalesQueryDto } from '../dtos/get-book-sales-query.dto';
import { UpdateBookSaleDto } from '../dtos/update-book-sale.dto';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { QueryBookSaleDto } from '../dtos/query-book-sale.dto';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post('sale')
  @UseGuards(AuthGuard('jwt'))
  async createUsedBookSale(
    @Body() createBookSaleDto: CreateBookSaleDto,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    const newSale = await this.bookService.createUsedBookSale(
      createBookSaleDto,
      userId,
    );
    return newSale;
  }

  /**
   * 필터링/검색/정렬 조건에 따라 중고책 판매글 목록을 조회합니다.
   * @param query - 검색, 필터링, 정렬, 페이지네이션 DTO
   */
  @Get('sales')
  searchSales(@Query() query: QueryBookSaleDto) {
    return this.bookService.searchSales(query);
  }

  /**
   * 판매글의 상태를 업데이트하는 엔드포인트
   * @param id - 판매글 ID
   * @param updateSaleStatusDto - 변경할 상태 정보
   */
  @Patch('sales/:id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateBookSaleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateSaleStatusDto: UpdateSaleStatusDto,
  ) {
    const userId = user.id;
    const updatedSale = await this.bookService.updateSaleStatus(
      id,
      userId,
      updateSaleStatusDto.status,
    );
    return updatedSale;
  }

  /**
   * 최근 판매글 목록을 조회하는 엔드포인트
   */
  @Get('sales/recent')
  getRecentSales() {
    return this.bookService.findRecentSales();
  }

  @Get('sales/:id')
  getSaleById(@Param('id', ParseIntPipe) id: number) {
    return this.bookService.findSaleById(id);
  }

  /**
   * 특정 책(ISBN)에 대한 판매글 목록을 페이지네이션으로 조회하는 API
   * @param isbn - 책의 ISBN
   * @param query - 페이지네이션 및 필터링 옵션 (page, limit, city, district)
   */
  @Get(':isbn/sales')
  getBookSales(
    @Param('isbn') isbn: string,
    @Query() query: GetBookSalesQueryDto,
  ) {
    return this.bookService.findSalesByIsbn(isbn, query);
  }

  /**
   * 판매글의 내용을 업데이트하는 엔드포인트
   */
  @Patch('sales/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateBookSale(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateBookSaleDto: UpdateBookSaleDto,
  ) {
    const userId = user.id;
    const updatedSale = await this.bookService.updateUsedBookSale(
      id,
      userId,
      updateBookSaleDto,
    );
    return {
      sale: updatedSale,
    };
  }

  /**
   * 판매글을 삭제하는 엔드포인트
   */
  @Delete('sales/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT) // 성공 시 204 No Content 응답
  async deleteBookSale(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    await this.bookService.deleteUsedBookSale(id, userId);
    return;
  }
}

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

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('책 (Book)')
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post('sale')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '중고책 판매글 작성',
    description: '새로운 중고책 판매글을 작성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '판매글이 성공적으로 생성되었습니다.',
  })
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
  @ApiOperation({
    summary: '판매글 검색 및 목록 조회',
    description: '필터링, 검색, 정렬 조건에 따라 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '판매글 목록을 반환합니다.' })
  async searchSales(@Query() query: QueryBookSaleDto) {
    return await this.bookService.searchSales(query);
  }

  /**
   * 판매글의 상태를 업데이트하는 엔드포인트
   * @param id - 판매글 ID
   * @param updateSaleStatusDto - 변경할 상태 정보
   */
  @Patch('sales/:id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '판매글 상태 변경',
    description: '판매글의 상태(판매중, 예약중, 판매완료)를 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상태가 성공적으로 변경되었습니다.',
  })
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
  @ApiOperation({
    summary: '최근 판매글 조회',
    description: '최근 등록된 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '최근 판매글 목록을 반환합니다.' })
  async getRecentSales() {
    return await this.bookService.findRecentSales();
  }

  @Get('sales/:id')
  @ApiOperation({
    summary: '판매글 상세 조회',
    description: '특정 판매글의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '판매글 상세 정보를 반환합니다.' })
  @ApiResponse({ status: 404, description: '판매글을 찾을 수 없습니다.' })
  async getSaleById(@Param('id', ParseIntPipe) id: number) {
    return await this.bookService.findSaleById(id);
  }

  /**
   * 특정 책(ISBN)에 대한 판매글 목록을 페이지네이션으로 조회하는 API
   * @param isbn - 책의 ISBN
   * @param query - 페이지네이션 및 필터링 옵션 (page, limit, city, district)
   */
  @Get(':isbn/sales')
  @ApiOperation({
    summary: 'ISBN별 판매글 조회',
    description: '특정 책(ISBN)에 대한 판매글 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '해당 책의 판매글 목록을 반환합니다.',
  })
  async getBookSales(
    @Param('isbn') isbn: string,
    @Query() query: GetBookSalesQueryDto,
  ) {
    return await this.bookService.findSalesByIsbn(isbn, query);
  }

  /**
   * 판매글의 내용을 업데이트하는 엔드포인트
   */
  @Patch('sales/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '판매글 수정',
    description: '판매글의 내용을 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '판매글이 성공적으로 수정되었습니다.',
  })
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '판매글 삭제', description: '판매글을 삭제합니다.' })
  @ApiResponse({
    status: 204,
    description: '판매글이 성공적으로 삭제되었습니다.',
  })
  async deleteBookSale(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    await this.bookService.deleteUsedBookSale(id, userId);
    return;
  }
  /**
   * 책 제목 또는 저자로 책을 검색하는 엔드포인트
   * @param query - 검색어
   */
  @Get('search')
  @ApiOperation({
    summary: '책 검색',
    description: '책 제목 또는 저자로 책을 검색합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '검색된 책 목록을 반환합니다.',
  })
  async searchBooks(@Query('query') query: string) {
    return await this.bookService.searchBooks(query);
  }
}

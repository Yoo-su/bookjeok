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
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookService } from '../services/book.service';
import { UsedBookViewCountInterceptor } from '../interceptors/used-book-view-count.interceptor';
import { BookViewCountInterceptor } from '../interceptors/book-view-count.interceptor';
import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { UpdateSaleStatusDto } from '../../user/dtos/update-sale-status.dto';
import { GetBookSalesQueryDto } from '../dtos/get-book-sales-query.dto';
import { UpdateBookSaleDto } from '../dtos/update-book-sale.dto';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { QueryBookSaleDto } from '../dtos/query-book-sale.dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

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

  @Get('sales')
  @ApiOperation({
    summary: '판매글 검색 및 목록 조회',
    description: '필터링, 검색, 정렬 조건에 따라 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '판매글 목록을 반환합니다.' })
  async searchSales(@Query() query: QueryBookSaleDto) {
    return await this.bookService.searchSales(query);
  }

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
  @ApiParam({ name: 'id', description: '판매글 ID' })
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

  @Get('sales/recent')
  @ApiOperation({
    summary: '최근 판매글 조회',
    description: '최근 등록된 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '최근 판매글 목록을 반환합니다.' })
  async getRecentSales() {
    return await this.bookService.findRecentSales();
  }

  @Get('sales/popular')
  @ApiOperation({
    summary: '인기 판매글 조회',
    description: '조회수가 높은 상위 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '인기 판매글 목록을 반환합니다.' })
  async getPopularSales() {
    return await this.bookService.findPopularSales();
  }

  @Get('popular')
  @ApiOperation({
    summary: '인기책 조회',
    description: '조회수, 판매글, 리뷰 데이터 기반 인기책 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '인기책 목록을 반환합니다.' })
  async getPopularBooks() {
    return await this.bookService.findPopularBooks();
  }

  @Post(':isbn/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(BookViewCountInterceptor)
  @ApiOperation({
    summary: '책 상세 조회수 기록',
    description:
      '책 상세페이지 접근 시 조회수를 기록합니다. (IP 기반 24시간 중복 방지)',
  })
  @ApiResponse({ status: 204, description: '조회수가 기록되었습니다.' })
  @ApiParam({ name: 'isbn', description: '책 ISBN' })
  recordBookView(): void {
    // 인터셉터가 조회수 처리, 204 No Content 응답
  }

  @Get('sales/:id')
  @UseInterceptors(UsedBookViewCountInterceptor)
  @ApiOperation({
    summary: '판매글 상세 조회',
    description: '특정 판매글의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '판매글 상세 정보를 반환합니다.' })
  @ApiResponse({ status: 404, description: '판매글을 찾을 수 없습니다.' })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  async getSaleById(@Param('id', ParseIntPipe) id: number) {
    return await this.bookService.findSaleById(id);
  }

  @Get(':isbn/sales')
  @ApiOperation({
    summary: 'ISBN별 판매글 조회',
    description: '특정 책(ISBN)에 대한 판매글 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '해당 책의 판매글 목록을 반환합니다.',
  })
  @ApiParam({ name: 'isbn', description: '책 ISBN' })
  async getBookSales(
    @Param('isbn') isbn: string,
    @Query() query: GetBookSalesQueryDto,
  ) {
    return await this.bookService.findSalesByIsbn(isbn, query);
  }

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
  @ApiParam({ name: 'id', description: '판매글 ID' })
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

  @Delete('sales/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '판매글 삭제', description: '판매글을 삭제합니다.' })
  @ApiResponse({
    status: 204,
    description: '판매글이 성공적으로 삭제되었습니다.',
  })
  @ApiParam({ name: 'id', description: '판매글 ID' })
  async deleteBookSale(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    await this.bookService.deleteUsedBookSale(id, userId);
    return;
  }
  @Get('search')
  @ApiOperation({
    summary: '책 검색',
    description: '책 제목 또는 저자로 책을 검색합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '검색된 책 목록을 반환합니다.',
  })
  @ApiQuery({ name: 'query', description: '검색어 (제목 또는 저자)' })
  async searchBooks(@Query('query') query: string) {
    return await this.bookService.searchBooks(query);
  }
}

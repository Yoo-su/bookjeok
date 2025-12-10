import {
  Controller,
  Get,
  UseGuards,
  Delete,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../services/user.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { BookInfoDto } from '@/features/book/dtos/book-info.dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('사용자 (User)')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('my-sales')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '내 판매글 조회',
    description: '내가 등록한 모든 판매글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '내 판매글 목록을 반환합니다.' })
  async getMySales(@CurrentUser() user: User) {
    const userId = user.id;
    return await this.userService.findMySales(userId);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '사용자 통계 조회',
    description: '사용자의 판매 및 구매 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 통계 정보를 반환합니다.' })
  async getStats(@CurrentUser() user: User) {
    return await this.userService.getUserStats(user.id);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '내 프로필 조회',
    description: '로그인한 사용자의 프로필 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 프로필 정보를 반환합니다.' })
  getUser(@CurrentUser() user: User) {
    return user;
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '회원 탈퇴',
    description: '회원 탈퇴를 진행합니다.',
  })
  @ApiResponse({ status: 200, description: '회원 탈퇴가 완료되었습니다.' })
  async withdraw(@CurrentUser() user: User) {
    await this.userService.withdraw(user.id);
    return {
      message: '회원 탈퇴가 완료되었습니다.',
    };
  }

  @Post('wishlist')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '위시리스트 추가',
    description: '책이나 판매글을 위시리스트에 추가합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['BOOK', 'SALE'],
          description: '타입 (BOOK, SALE)',
        },
        id: { type: 'string', description: 'ID' },
        bookData: {
          type: 'object',
          description: '책 정보 (type이 BOOK일 경우 필수)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '위시리스트에 추가되었습니다.' })
  async addToWishlist(
    @CurrentUser() user: User,
    @Body()
    body: {
      type: 'BOOK' | 'SALE';
      id: string | number;
      bookData?: BookInfoDto;
    },
  ) {
    return await this.userService.addToWishlist(
      user.id,
      body.type,
      body.id,
      body.bookData,
    );
  }

  @Delete('wishlist')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '위시리스트 삭제',
    description: '위시리스트에서 항목을 제거합니다.',
  })
  @ApiQuery({
    name: 'type',
    enum: ['BOOK', 'SALE'],
    description: '타입 (BOOK, SALE)',
  })
  @ApiQuery({ name: 'id', description: 'ID' })
  @ApiResponse({ status: 200, description: '위시리스트에서 제거되었습니다.' })
  async removeFromWishlist(
    @CurrentUser() user: User,
    @Query('type') type: 'BOOK' | 'SALE',
    @Query('id') id: string | number,
  ) {
    return await this.userService.removeFromWishlist(user.id, type, id);
  }

  @Get('wishlist')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '위시리스트 조회',
    description: '나의 위시리스트 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '위시리스트 목록을 반환합니다.' })
  async getWishlist(@CurrentUser() user: User) {
    return await this.userService.getWishlist(user.id);
  }

  @Get('wishlist/check')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '위시리스트 상태 확인',
    description: '특정 항목이 위시리스트에 있는지 확인합니다.',
  })
  @ApiQuery({
    name: 'type',
    enum: ['BOOK', 'SALE'],
    description: '타입 (BOOK, SALE)',
  })
  @ApiQuery({ name: 'id', description: 'ID' })
  @ApiResponse({
    status: 200,
    description: '위시리스트 포함 여부를 반환합니다.',
  })
  async checkWishlistStatus(
    @CurrentUser() user: User,
    @Query('type') type: 'BOOK' | 'SALE',
    @Query('id') id: string | number,
  ) {
    return await this.userService.checkWishlistStatus(user.id, type, id);
  }
}

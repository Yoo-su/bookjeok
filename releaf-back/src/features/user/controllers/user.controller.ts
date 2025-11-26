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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 내가 등록한 모든 판매글을 조회하는 엔드포인트
   */
  @Get('my-sales')
  @UseGuards(AuthGuard('jwt'))
  async getMySales(@CurrentUser() user: User) {
    const userId = user.id;
    return await this.userService.findMySales(userId);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@CurrentUser() user: User) {
    return await this.userService.getUserStats(user.id);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getUser(@CurrentUser() user: User) {
    return user;
  }

  /**
   * 회원 탈퇴
   */
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  async withdraw(@CurrentUser() user: User) {
    await this.userService.withdraw(user.id);
    return {
      message: '회원 탈퇴가 완료되었습니다.',
    };
  }

  /**
   * 위시리스트에 추가하는 엔드포인트
   */
  @Post('wishlist')
  @UseGuards(AuthGuard('jwt'))
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
  async removeFromWishlist(
    @CurrentUser() user: User,
    @Query('type') type: 'BOOK' | 'SALE',
    @Query('id') id: string | number,
  ) {
    return await this.userService.removeFromWishlist(user.id, type, id);
  }

  @Get('wishlist')
  @UseGuards(AuthGuard('jwt'))
  async getWishlist(@CurrentUser() user: User) {
    return await this.userService.getWishlist(user.id);
  }

  @Get('wishlist/check')
  @UseGuards(AuthGuard('jwt'))
  async checkWishlistStatus(
    @CurrentUser() user: User,
    @Query('type') type: 'BOOK' | 'SALE',
    @Query('id') id: string | number,
  ) {
    return await this.userService.checkWishlistStatus(user.id, type, id);
  }
}

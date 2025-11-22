import { Controller, Get, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../services/user.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';

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
    const sales = await this.userService.findMySales(userId);
    return sales;
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@CurrentUser() user: User) {
    const stats = await this.userService.getUserStats(user.id);
    return stats;
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
}

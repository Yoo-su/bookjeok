import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { OptionalJwtAuthGuard } from '@/features/auth/guards/optional-jwt-auth.guard';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { CurrentUser } from '../decorators/current-user.decorator';
import { MyProfileResponseDto } from '../dtos/my-profile-response.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';

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
  @ApiResponse({
    status: 200,
    description: '사용자 프로필 정보를 반환합니다.',
    type: MyProfileResponseDto,
  })
  getUser(@CurrentUser() user: User) {
    return new MyProfileResponseDto(user);
  }

  @Get('check-nickname')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '닉네임 중복 검사',
    description:
      '닉네임이 사용 가능한지 확인합니다. 로그인 상태인 경우 본인의 현재 닉네임은 사용 가능으로 처리됩니다.',
  })
  @ApiQuery({ name: 'nickname', description: '확인할 닉네임' })
  @ApiResponse({
    status: 200,
    description: '닉네임 사용 가능 여부를 반환합니다.',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
      },
    },
  })
  async checkNickname(
    @CurrentUser() user: User | undefined,
    @Query('nickname') nickname: string,
  ) {
    const available = await this.userService.checkNicknameAvailability(
      nickname,
      user?.id,
    );
    return { available };
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.PROFILE_UPDATE)
  @ApiOperation({
    summary: '내 정보 수정',
    description: '로그인한 사용자의 정보를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '수정된 사용자 정보를 반환합니다.',
    type: MyProfileResponseDto,
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.updateUser(
      user.id,
      updateUserDto,
    );
    return new MyProfileResponseDto(updatedUser);
  }

  @Get('profile/:handle')
  @ApiOperation({
    summary: '공개 프로필 조회',
    description:
      '다른 사용자의 공개 프로필 정보(닉네임, 프로필 이미지, 활동 통계 등)를 조회합니다.',
  })
  @ApiParam({ name: 'handle', description: '사용자 핸들' })
  @ApiResponse({
    status: 200,
    description: '공개 프로필 정보를 반환합니다.',
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  async getPublicProfile(@Param('handle') handle: string) {
    return await this.userService.getPublicProfileByHandle(handle);
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @TrackActivity(ActivityType.ACCOUNT_DELETE)
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
}

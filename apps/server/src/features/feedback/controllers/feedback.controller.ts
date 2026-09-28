import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

import { CreateFeedbackDto } from '../dtos/create-feedback.dto';
import { FeedbackService } from '../services/feedback.service';

@ApiTags('문의·제보 (Feedback)')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '문의·제보 보내기',
    description:
      '책 요청·버그·기능 제안 등을 운영자에게 보냅니다. 운영자에게 메일로 알립니다.',
  })
  @ApiResponse({ status: 201, description: '접수되었습니다.' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateFeedbackDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return await this.feedbackService.create(user.id, dto, userAgent);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '내 문의 목록',
    description:
      '내가 보낸 문의와 처리 상태·운영자 답변을 최신순으로 조회합니다.',
  })
  @ApiQuery({ name: 'cursor', required: false, type: Number })
  async findMine(
    @CurrentUser() user: User,
    @Query('cursor', new ParseIntPipe({ optional: true })) cursor?: number,
  ) {
    return await this.feedbackService.findMine(user.id, cursor);
  }
}

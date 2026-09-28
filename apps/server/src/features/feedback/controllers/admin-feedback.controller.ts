import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '@/features/auth/guards/admin.guard';

import { GetAdminFeedbackQueryDto } from '../dtos/get-admin-feedback-query.dto';
import { UpdateFeedbackDto } from '../dtos/update-feedback.dto';
import { FeedbackService } from '../services/feedback.service';

@ApiTags('문의·제보 운영 (Admin Feedback)')
@Controller('admin/feedback')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @ApiOperation({
    summary: '문의 목록 (운영자)',
    description: '상태·종류로 거른 문의를 최신순으로 조회합니다.',
  })
  async findAll(@Query() query: GetAdminFeedbackQueryDto) {
    return await this.feedbackService.findForAdmin(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '문의 처리 (운영자)',
    description:
      '상태·답변·메모를 바꿉니다. 답변을 새로 쓰거나 바꾸면 작성자에게 알림이 갑니다.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return await this.feedbackService.updateByAdmin(id, dto);
  }
}

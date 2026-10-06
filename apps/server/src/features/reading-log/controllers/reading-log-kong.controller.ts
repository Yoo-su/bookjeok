import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { ReadingLogKongService } from '../services/reading-log-kong.service';

@ApiTags('독서 기록 콩')
@Controller('reading-logs')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReadingLogKongController {
  constructor(private readonly kongService: ReadingLogKongService) {}

  @Get('kongs/received')
  @ApiOperation({
    summary: '받은 콩 조회',
    description:
      '내 독서 기록이 받은 콩을 최근에 받은 기록부터 반환합니다. 기록마다 보낸 사람이 최근 순으로 담깁니다.',
  })
  getReceived(@Request() req) {
    return this.kongService.getReceived(req.user.id);
  }

  @Get('kongs/sent')
  @ApiOperation({
    summary: '보낸 콩 조회',
    description:
      '한 사용자의 독서 기록 중 내가 콩을 보낸 기록 ID를 반환합니다. 공개 프로필 독서 키재기에서 씁니다.',
  })
  @ApiQuery({ name: 'handle', description: '기록 주인의 핸들' })
  getSent(@Request() req, @Query('handle') handle: string) {
    return this.kongService.getSent(req.user.id, handle);
  }

  @Post(':id/kongs')
  @HttpCode(HttpStatus.OK)
  @TrackActivity(ActivityType.READING_LOG_KONG, (req) => ({
    id: req.params.id,
  }))
  @ApiOperation({
    summary: '콩 보내기',
    description:
      '공개된 남의 독서 기록에 콩을 보냅니다. 한 기록에 한 알이며, 이미 보냈으면 sent: false로 그대로 성공합니다.',
  })
  @ApiParam({ name: 'id', description: '독서 기록 ID' })
  @ApiResponse({ status: 400, description: '내 기록에는 보낼 수 없습니다.' })
  @ApiResponse({
    status: 404,
    description: '기록이 없거나 비공개입니다.',
  })
  send(@Request() req, @Param('id') id: string) {
    return this.kongService.send(req.user.id, id);
  }
}

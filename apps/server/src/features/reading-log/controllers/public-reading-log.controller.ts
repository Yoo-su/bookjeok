import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ReadingLogService } from '../services/reading-log.service';

/** 공개 프로필에서 쓰는 독서 기록 조회. 인증 없이 열린다 */
@ApiTags('독서 기록 (공개)')
@Controller('reading-logs/users')
export class PublicReadingLogController {
  constructor(private readonly readingLogService: ReadingLogService) {}

  // ':handle/tower'는 이름을 바꾸기 전 경로. 운영 웹이 main에 반영되면 지운다(reading-log.controller 참고).
  @Get([':handle/stack', ':handle/tower'])
  @ApiOperation({
    summary: '공개 프로필 독서 키재기 조회',
    description:
      '사용자의 한 해 독서 기록을 책 크기와 함께 반환합니다. 독서 기록이 비공개면 빈 목록입니다. 인증 불필요.',
  })
  @ApiParam({ name: 'handle', description: '사용자 핸들' })
  @ApiQuery({ name: 'year', description: '조회할 연도 (YYYY)', example: 2026 })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  getPublicStack(@Param('handle') handle: string, @Query('year') year: string) {
    return this.readingLogService.getPublicStack(handle, Number(year));
  }
}

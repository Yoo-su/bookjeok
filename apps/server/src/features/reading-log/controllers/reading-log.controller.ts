import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BookResolvePipe } from '@/features/book/pipes/book-resolve.pipe';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';
import { IdempotencyInterceptor } from '@/shared/interceptors/idempotency.interceptor';

import { CreateReadingLogDto } from '../dtos/create-reading-log.dto';
import { UpdateReadingLogDto } from '../dtos/update-reading-log.dto';
import { UpdateReadingLogSettingsDto } from '../dtos/update-reading-log-settings.dto';
import { ReadingLogService } from '../services/reading-log.service';

@ApiTags('독서 기록 (Reading Log)')
@Controller('reading-logs')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReadingLogController {
  constructor(private readonly readingLogService: ReadingLogService) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @TrackActivity(ActivityType.READING_LOG_CREATE)
  @ApiOperation({
    summary: '독서 기록 생성',
    description: '새로운 독서 기록을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '독서 기록이 성공적으로 생성되었습니다.',
  })
  create(
    @Request() req,
    @Body(BookResolvePipe) createReadingLogDto: CreateReadingLogDto,
  ) {
    return this.readingLogService.create(req.user.id, createReadingLogDto);
  }

  @Get()
  @ApiOperation({
    summary: '독서 기록 조회',
    description: '연도/월별 기록 또는 최근 독서 기록 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '독서 기록 목록을 반환합니다.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: '조회할 연도 (YYYY)',
    example: 2026,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: '조회할 월 (1-12, 선택)',
    example: 7,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최근 기록 조회 시 개수 제한 (기본 50)',
    example: 50,
  })
  findAll(
    @Request() req,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('limit') limit?: number,
  ) {
    return this.readingLogService.findAll(req.user.id, {
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: '독서 통계 조회',
    description: '이번 달/올해 읽은 권수를 반환합니다.',
  })
  @ApiQuery({ name: 'year', example: 2024 })
  @ApiQuery({ name: 'month', example: 1 })
  getStats(
    @Request() req,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.readingLogService.getStats(req.user.id, year, month);
  }

  @Get('tower')
  @ApiOperation({
    summary: '책탑 조회',
    description:
      '한 해의 독서 기록을 완독일 순으로, 책 크기(mm)·무게·표지색과 함께 반환합니다. 실측이 없는 책은 추정값이며 sizeSource로 구분합니다.',
  })
  @ApiQuery({ name: 'year', description: '조회할 연도 (YYYY)', example: 2026 })
  getTower(@Request() req, @Query('year') year: string) {
    return this.readingLogService.getTower(req.user.id, Number(year));
  }

  @Get('settings')
  @ApiOperation({
    summary: '독서 기록 설정 조회',
    description: '독서 기록 공개 여부 등 설정을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '독서 기록 설정을 반환합니다.',
  })
  getSettings(@Request() req) {
    return this.readingLogService.getSettings(req.user.id);
  }

  @Patch('settings')
  @ApiOperation({
    summary: '독서 기록 설정 수정',
    description: '독서 기록 공개 여부를 수정합니다.',
  })
  @ApiBody({ type: UpdateReadingLogSettingsDto })
  @ApiResponse({
    status: 200,
    description: '수정된 독서 기록 설정 정보를 반환합니다.',
  })
  updateSettings(@Request() req, @Body() dto: UpdateReadingLogSettingsDto) {
    return this.readingLogService.updateSettings(
      req.user.id,
      dto.isReadingLogPublic,
    );
  }

  @Get('book/:isbn/status')
  @ApiOperation({
    summary: '도서별 내 기록 이력 조회',
    description:
      '내가 이 책을 기록한 횟수와 가장 최근 기록일을 반환합니다. 기록이 없으면 count 0, lastDate null입니다.',
  })
  @ApiParam({ name: 'isbn', description: '도서 ISBN' })
  @ApiResponse({
    status: 200,
    description: '기록 횟수와 가장 최근 기록일(YYYY-MM-DD)을 반환합니다.',
  })
  getBookStatus(@Request() req, @Param('isbn') isbn: string) {
    return this.readingLogService.getBookStatus(req.user.id, isbn);
  }

  @Get('list')
  @ApiOperation({
    summary: '독서 기록 리스트 조회 (Infinite Scroll)',
    description: '독서 기록을 커서 기반 페이지네이션으로 조회합니다.',
  })
  @ApiQuery({
    name: 'cursorId',
    required: false,
    description: '마지막 로드된 ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '가져올 개수 (기본 10)',
  })
  findAllInfinite(
    @Request() req,
    @Query('cursorId') cursorId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.readingLogService.findAllInfinite(
      req.user.id,
      cursorId,
      limit ? Number(limit) : 10,
    );
  }

  @Patch(':id')
  @TrackActivity(ActivityType.READING_LOG_UPDATE, (req) => ({
    id: req.params.id,
  }))
  @ApiOperation({
    summary: '독서 기록 수정',
    description: '기존 독서 기록의 메모 등을 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '독서 기록이 성공적으로 수정되었습니다.',
  })
  @ApiResponse({ status: 404, description: '해당 기록을 찾을 수 없습니다.' })
  @ApiParam({ name: 'id', description: '독서 기록 ID' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateReadingLogDto: UpdateReadingLogDto,
  ) {
    return this.readingLogService.update(req.user.id, id, updateReadingLogDto);
  }

  @Delete(':id')
  @TrackActivity(ActivityType.READING_LOG_DELETE, (req) => ({
    id: req.params.id,
  }))
  @ApiOperation({
    summary: '독서 기록 삭제',
    description: '특정 독서 기록을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '독서 기록이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({ status: 404, description: '해당 기록을 찾을 수 없습니다.' })
  @ApiParam({ name: 'id', description: '독서 기록 ID' })
  remove(@Request() req, @Param('id') id: string) {
    return this.readingLogService.remove(req.user.id, id);
  }
}

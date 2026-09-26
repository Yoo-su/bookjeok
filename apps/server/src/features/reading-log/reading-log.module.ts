import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookDimension } from '@/features/book/entities/book-dimension.entity';

import { User } from '../user/entities/user.entity';
import { LoungeController } from './controllers/lounge.controller';
import { PublicReadingLogController } from './controllers/public-reading-log.controller';
import { ReadingLogController } from './controllers/reading-log.controller';
import { ReadingLog } from './entities/reading-log.entity';
import { ReadingLogCleanupListener } from './listeners/reading-log-cleanup.listener';
import { ReadingLogService } from './services/reading-log.service';

@Module({
  // BookDimension은 독서 키재기 조인용 등록. autoLoadEntities라 여기서 빼면 메타데이터가 없다
  imports: [TypeOrmModule.forFeature([ReadingLog, User, BookDimension])],
  controllers: [
    ReadingLogController,
    LoungeController,
    PublicReadingLogController,
  ],
  providers: [ReadingLogService, ReadingLogCleanupListener],
  exports: [ReadingLogService],
})
export class ReadingLogModule {}

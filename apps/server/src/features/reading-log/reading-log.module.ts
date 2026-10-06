import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookDimension } from '@/features/book/entities/book-dimension.entity';
import { NotificationModule } from '@/features/notification/notification.module';
import { User } from '@/features/user/entities/user.entity';

import { LoungeController } from './controllers/lounge.controller';
import { PublicReadingLogController } from './controllers/public-reading-log.controller';
import { ReadingLogController } from './controllers/reading-log.controller';
import { ReadingLogKongController } from './controllers/reading-log-kong.controller';
import { ReadingLog } from './entities/reading-log.entity';
import { ReadingLogKong } from './entities/reading-log-kong.entity';
import { ReadingLogCleanupListener } from './listeners/reading-log-cleanup.listener';
import { ReadingLogNotificationListener } from './listeners/reading-log-notification.listener';
import { ReadingLogService } from './services/reading-log.service';
import { ReadingLogKongService } from './services/reading-log-kong.service';

@Module({
  // BookDimension은 독서 키재기 조인용 등록. autoLoadEntities라 여기서 빼면 메타데이터가 없다
  imports: [
    TypeOrmModule.forFeature([ReadingLog, ReadingLogKong, User, BookDimension]),
    NotificationModule,
  ],
  controllers: [
    ReadingLogController,
    ReadingLogKongController,
    LoungeController,
    PublicReadingLogController,
  ],
  providers: [
    ReadingLogService,
    ReadingLogKongService,
    ReadingLogCleanupListener,
    ReadingLogNotificationListener,
  ],
  exports: [ReadingLogService],
})
export class ReadingLogModule {}

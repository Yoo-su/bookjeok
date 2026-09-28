import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookModule } from '@/features/book/book.module';

import { LlmController } from './controllers/llm.controller';
import { AiBookSummary } from './entities/ai-book-summary.entity';
import { AiRequestLog } from './entities/ai-request-log.entity';
import { LlmCleanupListener } from './listeners/llm-cleanup.listener';
import { LlmService } from './services/llm.service';

@Module({
  imports: [
    ConfigModule,
    BookModule,
    TypeOrmModule.forFeature([AiRequestLog, AiBookSummary]),
  ],
  controllers: [LlmController],
  providers: [LlmService, LlmCleanupListener],
  exports: [LlmService],
})
export class LlmModule {}

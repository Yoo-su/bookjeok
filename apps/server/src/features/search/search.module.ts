import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookModule } from '@/features/book/book.module';
import { AiRequestLog } from '@/features/llm/entities/ai-request-log.entity';
import { SearchController } from '@/features/search/controllers/search.controller';
import { EmbeddingService } from '@/features/search/services/embedding.service';
import { RagService } from '@/features/search/services/rag.service';
import { SearchService } from '@/features/search/services/search.service';
import { SearchPreviewService } from '@/features/search/services/search-preview.service';
import { VectorSearchService } from '@/features/search/services/vector-search.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AiRequestLog]), BookModule],
  controllers: [SearchController],
  providers: [
    EmbeddingService,
    VectorSearchService,
    RagService,
    SearchService,
    SearchPreviewService,
  ],
  exports: [SearchService],
})
export class SearchModule {}

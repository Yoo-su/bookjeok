import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { Review } from './entities/review.entity';
import { ReviewReaction } from './entities/review-reaction.entity';
import { Tag } from './entities/tag.entity';
import { ReviewController } from './controllers/review.controller';
import { ReviewService } from './services/review.service';

import { ReviewImageHelper } from './helpers/review-image.helper';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Book, ReviewReaction, Tag])],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewImageHelper],
  exports: [ReviewService],
})
export class ReviewModule {}

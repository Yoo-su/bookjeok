import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { Review } from './entities/review.entity';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './services/reviews.service';

import { ReviewImageHelper } from './helpers/review-image.helper';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Book])],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewImageHelper],
  exports: [ReviewsService],
})
export class ReviewsModule {}

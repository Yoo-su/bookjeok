import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from '@/features/auth/auth.module';
import { UserModule } from '@/features/user/user.module';
import { User } from '@/features/user/entities/user.entity';
import { LoggerMiddleware } from '@/shared/middlewares/logger.middleware';
import { BookModule } from '@/features/book/book.module';
import { UsedBookSale } from '@/features/book/entities/used-book-sale.entity';
import { Book } from '@/features/book/entities/book.entity';
import { ChatModule } from '@/features/chat/chat.module';
import { LlmModule } from '@/features/llm/llm.module';
import { ReviewModule } from '@/features/review/review.module';
import { Review } from '@/features/review/entities/review.entity';
import { CommentModule } from '@/features/comment/comment.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 0, // 기본 TTL, 인터셉터에서 재정의됨
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Book, UsedBookSale, Review],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // 개발 환경에서만 true로 설정
        autoLoadEntities: true,
        extra: {
          max: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
        // SSL 설정 (Supabase 필수)
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    AuthModule,
    UserModule,
    BookModule,
    ChatModule,
    LlmModule,
    ReviewModule,
    CommentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS cube');
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS earthdistance');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

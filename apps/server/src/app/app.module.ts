import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ClsModule } from 'nestjs-cls';

import { AuthModule } from '@/features/auth/auth.module';
import { BookModule } from '@/features/book/book.module';
import { ChatModule } from '@/features/chat/chat.module';
import { CommentModule } from '@/features/comment/comment.module';
import { FeedbackModule } from '@/features/feedback/feedback.module';
import { HealthModule } from '@/features/health/health.module';
import { InsightsModule } from '@/features/insights/insights.module';
import { LlmModule } from '@/features/llm/llm.module';
import { NotificationModule } from '@/features/notification/notification.module';
import { OrderModule } from '@/features/order/order.module';
import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { ReviewModule } from '@/features/review/review.module';
import { SearchModule } from '@/features/search/search.module';
import { SearchKeywordModule } from '@/features/search-keyword/search-keyword.module';
import { TradeModule } from '@/features/trade/trade.module';
import { UsedBookSaleModule } from '@/features/used-book-sale/used-book-sale.module';
import { UserModule } from '@/features/user/user.module';
import { WishlistModule } from '@/features/wishlist/wishlist.module';
import { ActivityModule } from '@/shared/activity/activity.module';
import { SmartCacheModule } from '@/shared/cache/smart-cache.module';
import { MailModule } from '@/shared/mail/mail.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? undefined
          : ['.env', '../../.env'],
    }),

    // 전역 스케줄러 활성화
    ScheduleModule.forRoot(),

    // 전역 비동기 이벤트 시스템 활성화
    EventEmitterModule.forRoot(),

    // 전역 Rate Limiting (1분당 최대 120회 요청 허용)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),

    // 전역 캐시 모듈
    CacheModule.register({
      isGlobal: true,
      ttl: 0,
    }),

    // CLS 기반 선언적 트랜잭션 관리
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          imports: [TypeOrmModule],
          adapter: new TransactionalAdapterTypeOrm({
            dataSourceToken: getDataSourceToken(),
          }),
        }),
      ],
    }),

    // TypeORM 비동기 연결 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
        extra: {
          max: 40,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        },
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // 비즈니스 도메인 기능 모듈
    AuthModule,
    UserModule,
    BookModule,
    ReviewModule,
    CommentModule,
    ReadingLogModule,
    WishlistModule,
    UsedBookSaleModule,
    OrderModule,
    TradeModule,
    ChatModule,
    LlmModule,
    InsightsModule,
    SearchKeywordModule,
    SearchModule,
    NotificationModule,
    FeedbackModule,
    HealthModule,
    ActivityModule,
    SmartCacheModule,
    MailModule,
  ],
  controllers: [],
  providers: [
    // 전역 Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

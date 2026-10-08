import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from '@/features/review/entities/review.entity';
import {
  ReviewChangedEvent,
  ReviewEvents,
} from '@/features/review/events/review.events';
import { OnDomainEvent } from '@/shared/events/domain-event';

// 공개 소유 확인 값이다. web/public의 같은 이름 .txt 파일과 함께 교체한다.
export const REVIEW_INDEXNOW_KEY = '527f958b193648ebbb4a9d98a1829e42';
const SITE_URL = 'https://bookjeok.com';
const RETRY_DELAYS = [10_000, 60_000, 300_000, 1_800_000];
const MAX_PENDING = 1000;

interface PendingReview {
  reviewId: number;
  attempts: number;
  nextAttemptAt: number;
}

@Injectable()
export class ReviewIndexingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReviewIndexingService.name);
  private readonly pending = new Map<number, PendingReview>();
  private flushing = false;
  private stopped = false;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
  ) {}

  private get enabled(): boolean {
    return (
      this.config.get<string>('INDEXNOW_ENABLED') === 'true' &&
      this.config.get<string>('NODE_ENV') === 'production' &&
      this.config.get<string>('USER_WEB_URL')?.replace(/\/$/, '') ===
        SITE_URL &&
      Boolean(this.config.get<string>('REVALIDATE_TOKEN'))
    );
  }

  onModuleInit(): void {
    if (
      this.config.get<string>('INDEXNOW_ENABLED') === 'true' &&
      !this.enabled
    ) {
      this.logger.warn(
        'Review IndexNow disabled: production, USER_WEB_URL=https://bookjeok.com and REVALIDATE_TOKEN are required',
      );
    }
  }

  @OnDomainEvent(ReviewEvents.changed)
  handleChange(event: ReviewChangedEvent): void {
    if (!this.enabled || this.stopped) return;
    if (
      !event.isPublic &&
      !event.wasPublic &&
      !this.pending.has(event.reviewId)
    )
      return;

    if (!this.pending.has(event.reviewId) && this.pending.size >= MAX_PENDING) {
      this.logger.error(
        `Review IndexNow queue full; skipped ${event.reviewId}`,
      );
      return;
    }

    this.pending.set(event.reviewId, {
      reviewId: event.reviewId,
      attempts: 0,
      nextAttemptAt: Date.now(),
    });
    // 커밋 후 별도 타이머에서 시작한다. 네트워크 실패가 저장 응답에 전파되지 않는다.
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = undefined;
        void this.flush();
      }, 0);
      this.timer.unref();
    }
  }

  @Interval(10_000)
  async flush(): Promise<void> {
    if (this.flushing || this.stopped || !this.enabled) return;
    this.flushing = true;
    try {
      const due = [...this.pending.values()]
        .filter((job) => job.nextAttemptAt <= Date.now())
        .slice(0, 10);
      for (const job of due) {
        if (this.stopped) break;
        try {
          await this.submit(job);
          if (this.pending.get(job.reviewId) === job)
            this.pending.delete(job.reviewId);
        } catch (error: unknown) {
          // 전송 중 더 최신 변경이 들어왔다면 그 작업의 재시도 상태는 건드리지 않는다.
          if (this.pending.get(job.reviewId) !== job) continue;
          const delay = RETRY_DELAYS[job.attempts++];
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          if (delay === undefined) {
            this.pending.delete(job.reviewId);
            this.logger.error(
              `Review IndexNow exhausted for ${job.reviewId}: ${message}`,
            );
          } else {
            job.nextAttemptAt = Date.now() + delay;
            this.logger.warn(
              `Review IndexNow retry ${job.attempts} for ${job.reviewId}: ${message}`,
            );
          }
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private async request(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
  }

  private async submit(job: PendingReview): Promise<void> {
    // 큐의 과거 공개 상태 대신 현재 DB를 읽어 공개→비공개·삭제 경쟁을 처리한다.
    const review = await this.reviews.findOne({
      where: { id: job.reviewId },
      select: ['id', 'isPublic', 'updatedAt'],
    });
    const revalidation = await this.request(`${SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-token':
          this.config.getOrThrow<string>('REVALIDATE_TOKEN'),
      },
      body: JSON.stringify({
        reviewId: job.reviewId,
        removed: !review?.isPublic,
      }),
    });
    if (!revalidation.ok) {
      await revalidation.body?.cancel();
      throw new Error(`Revalidation HTTP ${revalidation.status}`);
    }
    // 이전 웹훅이 알 수 없는 body를 무시하는 경우에도 성공으로 오인하지 않는다.
    const result = (await revalidation.json()) as { reviewId?: number };
    if (result.reviewId !== job.reviewId)
      throw new Error('Review revalidation was not acknowledged');

    const url = `${SITE_URL}/ko/book/reviews/${job.reviewId}`;
    const page = await this.request(url);
    if (!review) {
      if (page.status !== 404 && page.status !== 410)
        throw new Error(`Deleted review still accessible: HTTP ${page.status}`);
      await page.body?.cancel();
    } else {
      if (page.status !== 200) {
        await page.body?.cancel();
        throw new Error(`Review page HTTP ${page.status}`);
      }
      const html = await page.text();
      const noindex = [...html.matchAll(/<meta\b[^>]*>/gi)].some(
        ([meta]) =>
          /name=["']robots["']/i.test(meta) &&
          /content=["'][^"']*noindex/i.test(meta),
      );
      if (review.isPublic) {
        if (noindex) throw new Error('Public review still noindex');
        const currentDate = review.updatedAt.toISOString();
        if (!html.includes(`"dateModified":"${currentDate}"`))
          throw new Error('Review HTML revision is stale');
      } else if (!noindex) {
        throw new Error('Private review still indexable');
      }
    }

    if (this.pending.get(job.reviewId) !== job || this.stopped) return;
    const keyLocation = `${SITE_URL}/${REVIEW_INDEXNOW_KEY}.txt`;
    const keyFile = await this.request(keyLocation);
    if (!keyFile.ok) {
      await keyFile.body?.cancel();
      throw new Error('IndexNow key file is not available');
    }
    if ((await keyFile.text()).trim() !== REVIEW_INDEXNOW_KEY)
      throw new Error('IndexNow key file is not available');

    if (this.pending.get(job.reviewId) !== job || this.stopped) return;

    const response = await this.request(
      'https://searchadvisor.naver.com/indexnow',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'bookjeok.com',
          key: REVIEW_INDEXNOW_KEY,
          keyLocation,
          urlList: [url],
        }),
      },
    );
    await response.body?.cancel();
    if (response.status !== 200 && response.status !== 202)
      throw new Error(`IndexNow HTTP ${response.status}`);
    this.logger.log(
      `Review IndexNow received ${job.reviewId}: HTTP ${response.status} (not an indexing confirmation)`,
    );
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.pending.size)
      this.logger.warn(
        `Review IndexNow shutdown with ${this.pending.size} pending URLs`,
      );
  }
}

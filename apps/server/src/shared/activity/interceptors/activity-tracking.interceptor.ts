import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { activityLogCreatedEvent } from '@/shared/activity/events/activity-log-created.event';
import { emitDomainEvent } from '@/shared/events/domain-event';

import {
  TRACK_ACTIVITY_KEY,
  TrackActivityMetadata,
} from '../decorators/track-activity.decorator';

@Injectable()
export class ActivityTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityTrackingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<TrackActivityMetadata>(
      TRACK_ACTIVITY_KEY,
      context.getHandler(),
    );

    // 대상이 아닌 경우 바로 통과
    if (!metadata) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // 응답이 성공적으로 나간 후 비동기로 처리
        this.processActivityLog(context, metadata);
      }),
    );
  }

  private processActivityLog(
    context: ExecutionContext,
    metadata: TrackActivityMetadata,
  ) {
    if (context.getType() !== 'http') return;

    const { activityType, extractor } = metadata;

    try {
      const request = context
        .switchToHttp()
        .getRequest<Request & { user?: { id: number } }>();
      const user = request.user;

      const ip =
        (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        request.ip ||
        request.socket?.remoteAddress;

      const userAgent = request.get('user-agent') || '';

      // 오직 추출기(extractor)를 통해서만 추가 상세 정보를 수집합니다. (암묵적 수집 제거)
      const details = extractor ? extractor(request) : null;

      const logData = {
        userId: user?.id ? Number(user.id) : null,
        activityType,
        method: request.method,
        path: request.originalUrl || request.url,
        ip: ip || 'unknown',
        userAgent,
        details: details && Object.keys(details).length > 0 ? details : null,
      };

      emitDomainEvent(this.eventEmitter, activityLogCreatedEvent, logData);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to dispatch activity log for ${activityType}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

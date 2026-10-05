import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { isPaymentEnabled } from '@/shared/config/feature-flags';

@Injectable()
export class PaymentFeatureGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (!isPaymentEnabled()) {
      // eslint-disable-next-line no-restricted-syntax -- 꺼진 결제 범위라 기존 503 응답 계약 유지
      throw new ServiceUnavailableException(
        '결제 및 주문 기능이 현재 준비 중입니다.',
      );
    }

    return true;
  }
}

import { ExecutionContext, HttpStatus } from '@nestjs/common';

import { BusinessException } from '@/shared/exceptions';

import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

const createContext = (authorization?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization ? { authorization } : {},
      }),
    }),
  }) as ExecutionContext;

describe('OptionalJwtAuthGuard', () => {
  const guard = new OptionalJwtAuthGuard();

  it('인증 헤더가 없는 익명 요청은 허용한다', () => {
    const result = guard.handleRequest(
      null,
      false,
      new Error('No auth token'),
      createContext(),
    );

    expect(result).toBeNull();
  });

  it('유효한 토큰의 사용자를 반환한다', () => {
    const user = { id: 10 };
    const result = guard.handleRequest(
      null,
      user,
      undefined,
      createContext('Bearer valid-token'),
    );

    expect(result).toBe(user);
  });

  it('인증 헤더가 있지만 토큰이 유효하지 않으면 401을 반환한다', () => {
    expect(() =>
      guard.handleRequest(
        null,
        false,
        new Error('jwt expired'),
        createContext('Bearer expired-token'),
      ),
    ).toThrow(
      expect.objectContaining({
        errorCode: 'AUTH_UNAUTHORIZED',
        status: HttpStatus.UNAUTHORIZED,
      }) as BusinessException,
    );
  });
});

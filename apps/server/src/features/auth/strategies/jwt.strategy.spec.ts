import { ConfigService } from '@nestjs/config';

import { UserService } from '@/features/user/services/user.service';
import { BusinessException } from '@/shared/exceptions';

import { JwtPayload } from '../types/jwt-payload.type';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JWT 전략의 tokenVersion 검사', () => {
  const findById = jest.fn();
  const userService = { findById } as unknown as UserService;
  const configService = {
    get: () => 'test-secret',
  } as unknown as ConfigService;

  const strategies = [
    ['액세스', new JwtStrategy(userService, configService)],
    ['리프레시', new JwtRefreshStrategy(configService, userService)],
  ] as const;

  const payload = (tokenVersion?: number) =>
    ({ sub: 1, nickname: 'n', role: 'USER', tokenVersion }) as JwtPayload;

  beforeEach(() => findById.mockReset());

  describe.each(strategies)('%s 토큰', (_, strategy) => {
    it('버전이 같으면 유저를 돌려준다', async () => {
      const user = { id: 1, tokenVersion: 2, deletedAt: null };
      findById.mockResolvedValue(user);

      await expect(strategy.validate(payload(2))).resolves.toBe(user);
    });

    it('로그아웃으로 버전이 오른 뒤의 토큰을 거부한다', async () => {
      findById.mockResolvedValue({ id: 1, tokenVersion: 3, deletedAt: null });

      await expect(strategy.validate(payload(2))).rejects.toBeInstanceOf(
        BusinessException,
      );
    });

    it('버전을 싣기 전 발급된 토큰은 배포 순간의 대량 거부를 막으려 통과시킨다', async () => {
      const user = { id: 1, tokenVersion: 5, deletedAt: null };
      findById.mockResolvedValue(user);

      await expect(strategy.validate(payload())).resolves.toBe(user);
    });

    it('탈퇴한 계정을 거부한다', async () => {
      findById.mockResolvedValue({
        id: 1,
        tokenVersion: 0,
        deletedAt: new Date(),
      });

      await expect(strategy.validate(payload(0))).rejects.toBeInstanceOf(
        BusinessException,
      );
    });
  });
});

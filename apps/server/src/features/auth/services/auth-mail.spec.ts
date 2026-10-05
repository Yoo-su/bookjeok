import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { AuthService } from '@/features/auth/services/auth.service';
import { verificationMail } from '@/features/user/mail/verification.mail';
import { UserService } from '@/features/user/services/user.service';
import { MailService } from '@/shared/mail/mail.service';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hash') }));

describe('회원가입 인증 메일', () => {
  it.each(['pending', 'failed'])(
    '발송이 %s여도 가입 결과를 반환한다',
    async (mode) => {
      const createdUser = { id: 1, isEmailVerified: false };
      const users = {
        findByEmail: jest.fn().mockResolvedValue(null),
        checkNicknameAvailability: jest.fn().mockResolvedValue(true),
        createEmailUser: jest.fn().mockResolvedValue(createdUser),
      };
      const mail = {
        send: jest
          .fn()
          .mockReturnValue(
            mode === 'pending'
              ? new Promise(() => {})
              : Promise.resolve({ status: 'failed', reason: 'delivery' }),
          ),
      };
      const module = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: new ConfigService({
              JWT_SECRET: 'secret',
              JWT_REFRESH_SECRET: 'refresh-secret',
            }),
          },
          { provide: UserService, useValue: users },
          { provide: JwtService, useValue: {} },
          { provide: CACHE_MANAGER, useValue: {} },
          { provide: MailService, useValue: mail },
        ],
      }).compile();
      const input = {
        email: 'new@example.com',
        password: 'password',
        nickname: '독자',
        name: '이름',
      };
      await expect(module.get(AuthService).register(input)).resolves.toBe(
        createdUser,
      );
      expect(mail.send).toHaveBeenCalledWith(verificationMail, {
        email: input.email,
        nickname: input.nickname,
        token: users.createEmailUser.mock.calls[0][6],
      });
      expect(users.createEmailUser.mock.invocationCallOrder[0]).toBeLessThan(
        mail.send.mock.invocationCallOrder[0],
      );
      await module.close();
    },
  );
});

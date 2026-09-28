import { ClassSerializerInterceptor, SerializeOptions } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { instanceToPlain } from 'class-transformer';
import { lastValueFrom, of } from 'rxjs';

import { toSocketPayload } from '@/shared/websocket/to-socket-payload';

import { USER_SELF_GROUP } from '../constants';
import { User } from './user.entity';

const HIDDEN_ALWAYS = [
  'password',
  'emailVerificationToken',
  'emailVerificationExpiresAt',
  'tokenVersion',
];
const SELF_ONLY = [
  'email',
  'provider',
  'providerId',
  'name',
  'gender',
  'ageRange',
];
const PUBLIC = [
  'id',
  'nickname',
  'handle',
  'profileImageUrl',
  'deletedAt',
  'lastActiveAt',
  'isEmailVerified',
];

function makeUser(): User {
  return Object.assign(new User(), {
    id: 7,
    provider: 'local',
    providerId: 'local_7',
    email: 'reader@example.com',
    password: '$2b$10$hash',
    nickname: '독자',
    handle: 'reader',
    profileImageUrl: 'https://example.com/p.png',
    deletedAt: null,
    lastActiveAt: new Date('2026-09-01T00:00:00Z'),
    isEmailVerified: true,
    name: '홍길동',
    gender: 'M',
    ageRange: '20-29',
    emailVerificationToken: 'token',
    emailVerificationExpiresAt: new Date(),
    tokenVersion: 3,
  });
}

describe('User 직렬화', () => {
  it('기본(남에게 보이는 응답)에서는 공개 필드만 남긴다', () => {
    const plain = instanceToPlain(makeUser());

    for (const key of [...HIDDEN_ALWAYS, ...SELF_ONLY]) {
      expect(plain).not.toHaveProperty(key);
    }
    for (const key of PUBLIC) {
      expect(plain).toHaveProperty(key);
    }
  });

  it('본인 그룹이면 본인용 필드를 내보내되 비밀 필드는 숨긴다', () => {
    const plain = instanceToPlain(makeUser(), { groups: [USER_SELF_GROUP] });

    for (const key of [...SELF_ONLY, ...PUBLIC]) {
      expect(plain).toHaveProperty(key);
    }
    for (const key of HIDDEN_ALWAYS) {
      expect(plain).not.toHaveProperty(key);
    }
  });

  it('평범한 객체에 담긴 사용자도 규칙이 적용된다 (서비스의 스프레드 응답)', () => {
    const plain = instanceToPlain({ id: 1, isLiked: true, user: makeUser() });

    expect(plain.user).toHaveProperty('nickname');
    expect(plain.user).not.toHaveProperty('email');
    expect(plain.user).not.toHaveProperty('password');
  });

  it('소켓 페이로드도 같은 규칙으로 직렬화한다', () => {
    const plain = toSocketPayload({ id: 1, sender: makeUser() });
    const sender = plain.sender as Record<string, unknown>;

    expect(sender.nickname).toBe('독자');
    expect(sender).not.toHaveProperty('password');
    expect(sender).not.toHaveProperty('email');
    expect(sender).not.toHaveProperty('name');
  });

  it('전역 직렬화 인터셉터는 핸들러의 본인 그룹 옵션을 따른다', async () => {
    class LoginController {
      @SerializeOptions({ groups: [USER_SELF_GROUP] })
      login(this: void) {}
    }
    const interceptor = new ClassSerializerInterceptor(new Reflector());
    const context = {
      getHandler: () => LoginController.prototype.login,
      getClass: () => LoginController,
    } as never;

    const result = await lastValueFrom(
      interceptor.intercept(context, {
        handle: () => of({ user: makeUser() }),
      }),
    );

    expect(result.user).toHaveProperty('email', 'reader@example.com');
    expect(result.user).not.toHaveProperty('password');
  });
});

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateUserDto } from './update-user.dto';

// 보이지 않는 문자는 소스에 그대로 쓰면 읽을 수 없어 코드 포인트로 만든다
const HANGUL_FILLER = String.fromCharCode(0x3164);
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const DECOMPOSED_GANA = String.fromCharCode(0x1100, 0x1161, 0x1102, 0x1161);

const check = async (body: Record<string, unknown>) => {
  const dto = plainToInstance(UpdateUserDto, body);
  const errors = await validate(dto);
  return { dto, failed: errors.map((e) => e.property) };
};

describe('UpdateUserDto', () => {
  it('빈 요청은 받는다', async () => {
    expect((await check({})).failed).toEqual([]);
  });

  describe('nickname', () => {
    it.each(['독자', '행복한 판다', 'book_lover'])(
      '%s는 받는다',
      async (nickname) => {
        expect((await check({ nickname })).failed).toEqual([]);
      },
    );

    it('앞뒤 공백을 걷어내고 NFC로 합쳐 저장한다', async () => {
      const { dto, failed } = await check({ nickname: ` ${DECOMPOSED_GANA} ` });
      expect(failed).toEqual([]);
      expect(dto.nickname).toBe('가나');
    });

    it.each([
      null,
      '',
      '   ',
      '가',
      '가'.repeat(21),
      HANGUL_FILLER.repeat(2),
      ZERO_WIDTH_SPACE.repeat(2),
      '행복한  판다',
      '독자😀',
      123,
    ])('%j는 거부한다', async (nickname) => {
      expect((await check({ nickname })).failed).toEqual(['nickname']);
    });
  });

  describe('profileImageUrl', () => {
    it.each([
      'default_profile1',
      'default_profile10',
      'https://abc123.public.blob.vercel-storage.com/local-1/profile/a.jpg',
      null,
    ])('%j는 받는다', async (profileImageUrl) => {
      expect((await check({ profileImageUrl })).failed).toEqual([]);
    });

    it.each([
      'default_profile11',
      'https://evil.example.com/track.gif',
      'http://abc123.public.blob.vercel-storage.com/a.jpg',
      'https://evil.com/?x=.public.blob.vercel-storage.com/a.jpg',
      'javascript:alert(1)',
    ])('%s는 거부한다', async (profileImageUrl) => {
      expect((await check({ profileImageUrl })).failed).toEqual([
        'profileImageUrl',
      ]);
    });
  });

  describe('name', () => {
    it('공백뿐이면 null로 비운다', async () => {
      const { dto, failed } = await check({ name: '   ' });
      expect(failed).toEqual([]);
      expect(dto.name).toBeNull();
    });

    it('50자를 넘으면 거부한다', async () => {
      expect((await check({ name: '가'.repeat(51) })).failed).toEqual(['name']);
    });
  });

  describe('gender · ageRange', () => {
    it('정해진 값과 null은 받는다', async () => {
      expect((await check({ gender: 'M', ageRange: '60-' })).failed).toEqual(
        [],
      );
      expect((await check({ gender: null, ageRange: null })).failed).toEqual(
        [],
      );
    });

    it('그 밖의 값은 거부한다', async () => {
      expect(
        (await check({ gender: 'X', ageRange: 'none' })).failed.sort(),
      ).toEqual(['ageRange', 'gender']);
    });
  });
});

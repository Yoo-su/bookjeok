import { PATH_METADATA } from '@nestjs/common/constants';

import { PublicReadingLogController } from './public-reading-log.controller';
import { ReadingLogController } from './reading-log.controller';

// 메서드를 꺼내 쓰지 않고 데코레이터 메타데이터만 읽는다
const handler = (target: object, name: string): object =>
  Object.getOwnPropertyDescriptor(target, name)?.value as object;

describe('독서 키재기 경로', () => {
  it('이름을 바꾸는 동안 새 경로와 옛 경로를 함께 받는다', () => {
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        handler(ReadingLogController.prototype, 'getStack'),
      ),
    ).toEqual(['stack', 'tower']);
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        handler(PublicReadingLogController.prototype, 'getPublicStack'),
      ),
    ).toEqual([':handle/stack', ':handle/tower']);
  });
});

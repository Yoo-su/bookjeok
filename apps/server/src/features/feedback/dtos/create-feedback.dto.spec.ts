import { FeedbackType } from '@bookjeok/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateFeedbackDto } from './create-feedback.dto';

const errorsFor = async (pagePath: string) => {
  const dto = plainToInstance(CreateFeedbackDto, {
    type: FeedbackType.OTHER,
    content: '문의',
    pagePath,
  });
  const errors = await validate(dto);
  return errors.filter((e) => e.property === 'pagePath');
};

describe('CreateFeedbackDto.pagePath', () => {
  it.each(['/ko/book/search?q=급류', '/'])('경로 %s는 받는다', async (path) => {
    expect(await errorsFor(path)).toHaveLength(0);
  });

  // 운영자 메일에서 https://bookjeok.com@evil.com 같은 링크가 되지 않게
  it.each(['@evil.com/login', 'https://evil.com', 'evil.com'])(
    '경로가 아닌 %s는 거부한다',
    async (path) => {
      expect(await errorsFor(path)).toHaveLength(1);
    },
  );
});

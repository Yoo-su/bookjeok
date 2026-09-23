import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ReviewReactionType } from '../entities/review-reaction.entity';
import { ToggleReactionDto } from './toggle-reaction.dto';

const validateType = (type: unknown) =>
  validate(plainToInstance(ToggleReactionDto, { type }));

describe('ToggleReactionDto', () => {
  it.each(Object.values(ReviewReactionType))('%s는 통과한다', async (type) => {
    expect(await validateType(type)).toHaveLength(0);
  });

  it.each([['like'], ['UNKNOWN'], [''], [null], [undefined], [1]])(
    '정의되지 않은 값 %p은 거부한다',
    async (type) => {
      const errors = await validateType(type);
      expect(errors[0]?.property).toBe('type');
    },
  );
});

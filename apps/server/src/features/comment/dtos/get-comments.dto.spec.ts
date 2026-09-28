import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CommentTargetType } from '../entities/comment.entity';
import { GetCommentsDto } from './get-comments.dto';

const errorsOf = async (query: Record<string, string>) => {
  const dto = plainToInstance(GetCommentsDto, {
    targetType: CommentTargetType.REVIEW,
    targetId: '12',
    ...query,
  });
  const errors = await validate(dto);
  return errors.map((error) => error.property);
};

describe('GetCommentsDto', () => {
  it('웹이 보내는 기본 조회는 통과한다', async () => {
    expect(await errorsOf({ page: '1', limit: '10' })).toEqual([]);
    expect(await errorsOf({ limit: '10', cursorId: '345' })).toEqual([]);
    expect(await errorsOf({})).toEqual([]);
  });

  it.each([
    ['limit 0 (take(0)은 전량 조회)', { limit: '0' }, 'limit'],
    ['limit 상한 초과', { limit: '51' }, 'limit'],
    ['음수 page (음수 OFFSET은 500)', { page: '-1' }, 'page'],
    ['숫자가 아닌 limit', { limit: 'abc' }, 'limit'],
    ['0 커서', { cursorId: '0' }, 'cursorId'],
  ])('%s는 400으로 막는다', async (_, query, property) => {
    expect(await errorsOf(query)).toContain(property);
  });
});

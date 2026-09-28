import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { SearchKeywordService } from '../services/search-keyword.service';
import { SearchKeywordController } from './search-keyword.controller';

describe('SearchKeywordController', () => {
  let controller: SearchKeywordController;
  let service: { recordSearchKeyword: jest.Mock };
  let warn: jest.SpyInstance;

  beforeEach(async () => {
    service = { recordSearchKeyword: jest.fn() };
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchKeywordController],
      providers: [{ provide: SearchKeywordService, useValue: service }],
    }).compile();

    controller = module.get(SearchKeywordController);
  });

  afterEach(() => warn.mockRestore());

  // 기다리지 않는 호출이라 거부를 놓치면 unhandledRejection으로 프로세스가 죽는다
  it('검색어 기록 실패를 잡아 로그로 남긴다', async () => {
    service.recordSearchKeyword.mockRejectedValue(new Error('connection lost'));

    controller.recordSearchKeyword({ keyword: '소년이 온다' });
    await new Promise(setImmediate);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('connection lost'),
    );
  });
});

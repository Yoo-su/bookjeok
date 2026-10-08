import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Review } from '@/features/review/entities/review.entity';

import {
  REVIEW_INDEXNOW_KEY,
  ReviewIndexingService,
} from './review-indexing.service';

const REVIEW_ID = 42;
const MODIFIED = '2026-10-07T02:00:00.000Z';
const URL = `https://bookjeok.com/ko/book/reviews/${REVIEW_ID}`;
const html = `<meta name="robots" content="index, follow"><script type="application/ld+json">{"@type":"Review","dateModified":"${MODIFIED}"}</script>`;

describe('ReviewIndexingService', () => {
  let service: ReviewIndexingService;
  let config: ConfigService;
  let findOne: jest.Mock;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let errorLog: jest.SpyInstance;

  const sentBody = (index: number): unknown => {
    const body = fetchMock.mock.calls[index][1]?.body;
    if (typeof body !== 'string') throw new Error('Expected JSON string body');
    const value: unknown = JSON.parse(body);
    return value;
  };

  const change = (isPublic = true, wasPublic = true) =>
    service.handleChange({ reviewId: REVIEW_ID, isPublic, wasPublic });

  const responses = (pageHtml = html, status = 200, indexStatus = 200) => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ reviewId: REVIEW_ID, revalidated: true }),
      )
      .mockResolvedValueOnce(new Response(pageHtml, { status }))
      .mockResolvedValueOnce(new Response(REVIEW_INDEXNOW_KEY))
      .mockResolvedValueOnce(new Response('', { status: indexStatus }));
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    config = new ConfigService({
      INDEXNOW_ENABLED: 'true',
      NODE_ENV: 'production',
      USER_WEB_URL: 'https://bookjeok.com',
      REVALIDATE_TOKEN: 'test-revalidation-token',
    });
    findOne = jest.fn().mockResolvedValue({
      id: REVIEW_ID,
      isPublic: true,
      updatedAt: new Date(MODIFIED),
    });
    const module = await Test.createTestingModule({
      providers: [
        ReviewIndexingService,
        { provide: ConfigService, useValue: config },
        { provide: getRepositoryToken(Review), useValue: { findOne } },
      ],
    }).compile();
    service = module.get(ReviewIndexingService);
    fetchMock = jest.spyOn(global, 'fetch');
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorLog = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('공개 키 파일은 서버와 일치하고 네이버 형식에 맞는다', () => {
    expect(REVIEW_INDEXNOW_KEY).toMatch(/^[a-fA-F0-9-]{8,128}$/);
    expect(
      readFileSync(
        resolve(
          __dirname,
          '../../../../../web/public',
          `${REVIEW_INDEXNOW_KEY}.txt`,
        ),
        'utf8',
      ).trim(),
    ).toBe(REVIEW_INDEXNOW_KEY);
  });

  it('등록 요청에서는 전송하지 않고 상세 갱신·최신 HTML·키 확인 후 정규 URL을 전송한다', async () => {
    responses();
    change(true, false);
    expect(fetchMock).not.toHaveBeenCalled();
    await service.flush();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://bookjeok.com/api/revalidate',
      URL,
      `https://bookjeok.com/${REVIEW_INDEXNOW_KEY}.txt`,
      'https://searchadvisor.naver.com/indexnow',
    ]);
    expect(sentBody(0)).toEqual({
      reviewId: REVIEW_ID,
      removed: false,
    });
    expect(sentBody(3)).toEqual({
      host: 'bookjeok.com',
      key: REVIEW_INDEXNOW_KEY,
      keyLocation: `https://bookjeok.com/${REVIEW_INDEXNOW_KEY}.txt`,
      urlList: [URL],
    });
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('처음부터 비공개인 리뷰는 큐에 넣지 않는다', async () => {
    change(false, false);
    await service.flush();
    expect(findOne).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['INDEXNOW_ENABLED', 'NODE_ENV', 'USER_WEB_URL', 'REVALIDATE_TOKEN'])(
    '운영 조건 %s가 맞지 않으면 전송하지 않는다',
    async (setting) => {
      config.set(setting, '');
      change();
      await service.flush();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('같은 id의 빠른 변경을 합치고 DB의 최종 비공개 상태를 사용한다', async () => {
    findOne.mockResolvedValue({
      id: REVIEW_ID,
      isPublic: false,
      updatedAt: new Date(MODIFIED),
    });
    responses('<meta name="robots" content="noindex, nofollow">');
    change(true, false);
    change(false, true);
    await service.flush();
    expect(sentBody(0)).toEqual({
      reviewId: REVIEW_ID,
      removed: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('삭제된 공개 리뷰는 404를 확인한 뒤 기존 URL 변경을 알린다', async () => {
    findOne.mockResolvedValue(null);
    responses('', 404);
    change(false, true);
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each([
    ['공개 글 noindex', '<meta name="robots" content="noindex">'],
    ['오래된 본문', html.replace(MODIFIED, '2026-10-06T02:00:00.000Z')],
  ])('%s면 네이버에 보내지 않는다', async (_name, pageHtml) => {
    responses(pageHtml);
    change();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('비공개 전환 후 indexable HTML이 남으면 전송을 보류한다', async () => {
    findOne.mockResolvedValue({ isPublic: false });
    responses();
    change(false, true);
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('키 파일이 아직 배포되지 않았으면 전송하지 않는다', async () => {
    responses();
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(Response.json({ reviewId: REVIEW_ID }))
      .mockResolvedValueOnce(new Response(html))
      .mockResolvedValueOnce(new Response('not found', { status: 404 }));
    change();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('웹훅 실패는 삼키고 10초 뒤 재시도한다', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
    change();
    await expect(service.flush()).resolves.toBeUndefined();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    jest.setSystemTime(Date.now() + 10_000);
    responses();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('네트워크 오류도 저장 경로로 전파하지 않는다', async () => {
    fetchMock.mockRejectedValueOnce(new Error('fetch failed'));
    change();
    await expect(service.flush()).resolves.toBeUndefined();
    jest.setSystemTime(Date.now() + 10_000);
    responses();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('삭제된 글의 이전 200 캐시가 남아 있으면 네이버 알림을 보류한다', async () => {
    findOne.mockResolvedValue(null);
    responses();
    change(false, true);
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('이전 웹훅의 200만으로 상세 재검증 성공을 판단하지 않는다', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ revalidated: true }));
    change();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('429도 재시도하고 다섯 번 실패하면 큐에서 제거한다', async () => {
    change();
    for (let i = 0; i < 5; i++) {
      responses(html, 200, 429);
      await service.flush();
      jest.setSystemTime(Date.now() + 1_800_000);
    }
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(20);
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('exhausted'));
  });

  it('202는 수신 완료로 처리한다', async () => {
    responses(html, 200, 202);
    change();
    await service.flush();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('전송 중 들어온 변경을 이전 작업 완료가 지우지 않는다', async () => {
    fetchMock.mockImplementationOnce(() => {
      change();
      return Promise.resolve(Response.json({ reviewId: REVIEW_ID }));
    });
    fetchMock.mockResolvedValueOnce(new Response(html));
    change();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockReset();
    responses();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});

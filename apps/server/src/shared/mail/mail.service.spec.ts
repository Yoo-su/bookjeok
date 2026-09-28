import { FeedbackType } from '@bookjeok/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Feedback } from '@/features/feedback/entities/feedback.entity';

import { MailService } from './mail.service';

const send = jest.fn().mockResolvedValue({ error: null });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}));

const createService = (env: Record<string, string | undefined>) =>
  new MailService({
    get: (key: string) => env[key],
  } as unknown as ConfigService);

const feedback = (overrides: Partial<Feedback> = {}): Feedback =>
  ({
    id: 3,
    userId: 1,
    user: { id: 1, nickname: '<b>독자</b>', email: 'reader@example.com' },
    type: FeedbackType.BUG,
    content: '<script>alert(1)</script>\n두 번째 줄',
    details: { pagePath: '/book/search?q=a&b=<c>' },
    ...overrides,
  }) as Feedback;

describe('MailService.sendFeedbackNotice', () => {
  beforeEach(() => {
    send.mockClear();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('운영자 메일로 보내고 사용자 입력은 이스케이프한다', async () => {
    const service = createService({
      RESEND_API_KEY: 'key',
      FEEDBACK_NOTIFY_EMAIL: 'ops@example.com',
      CLIENT_DOMAIN: 'https://bookjeok.com',
    });

    await expect(service.sendFeedbackNotice(feedback())).resolves.toBe(true);

    const mail = send.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
    };
    expect(mail.to).toBe('ops@example.com');
    expect(mail.subject).toBe(
      '[북적 문의] 버그 제보 · <script>alert(1)</script> 두 번째 줄',
    );
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('&lt;b&gt;독자&lt;/b&gt;');
    expect(mail.html).toContain(
      'https://bookjeok.com/book/search?q=a&amp;b=&lt;c&gt;',
    );
  });

  it('책 요청은 제목으로 제목줄을 만든다', async () => {
    const service = createService({
      RESEND_API_KEY: 'key',
      FEEDBACK_NOTIFY_EMAIL: 'ops@example.com',
    });

    await service.sendFeedbackNotice(
      feedback({
        type: FeedbackType.BOOK_REQUEST,
        content: '',
        details: { bookTitle: '급류' },
      }),
    );

    expect(send.mock.calls[0][0].subject).toBe('[북적 문의] 책 요청 · 급류');
  });

  it('탈퇴한 작성자도 보낸다', async () => {
    const service = createService({
      RESEND_API_KEY: 'key',
      FEEDBACK_NOTIFY_EMAIL: 'ops@example.com',
    });

    await service.sendFeedbackNotice(feedback({ user: null, userId: null }));

    expect(send.mock.calls[0][0].html).toContain('탈퇴한 회원');
  });

  it('받을 주소가 없으면 보내지 않는다', async () => {
    const service = createService({ RESEND_API_KEY: 'key' });

    await expect(service.sendFeedbackNotice(feedback())).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});

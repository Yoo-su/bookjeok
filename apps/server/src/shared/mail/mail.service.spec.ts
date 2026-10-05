import { FeedbackType } from '@bookjeok/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { chatRoomCreatedMail } from '@/features/chat/mail/chat-room-created.mail';
import {
  FeedbackNoticeInput,
  feedbackNoticeMail,
} from '@/features/feedback/mail/feedback-notice.mail';
import { verificationMail } from '@/features/user/mail/verification.mail';
import { MailService } from '@/shared/mail/mail.service';
import type { MailDefinition } from '@/shared/mail/mail-definition';
import { html } from '@/shared/mail/mail-renderer';
import { ResendMailDelivery } from '@/shared/mail/resend-mail-delivery';

const send = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}));

const createService = (env: Record<string, string | undefined> = {}) => {
  const config = new ConfigService(env);
  return new MailService(config, new ResendMailDelivery(config));
};

const feedback = (
  overrides: Partial<FeedbackNoticeInput> = {},
): FeedbackNoticeInput => ({
  id: 3,
  user: { id: 1, nickname: '<b>독자</b>', email: 'reader@example.com' },
  type: FeedbackType.BUG,
  content: '<script>alert(1)</script>\n두 번째 줄',
  details: { pagePath: '/book/search?q=a&b=<c>' },
  ...overrides,
});
const chat = {
  seller: {
    id: 1,
    nickname: '<b>판매자</b>',
    email: 'seller@example.com',
    isEmailVerified: true,
  },
  buyerNickname: '<img src="buyer">',
  bookTitle: '책 <제목> & "인용"',
  chatRoomId: 20,
};
const verification = {
  email: 'new@example.com',
  nickname: '<b>독자</b>',
  token: 'a&b"c',
};

// 실제 발송 interface부터 mock 공급자까지 렌더링·정책·전달을 함께 검증한다.
describe('MailService', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ error: null });
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('운영자 메일로 보내고 제목·정보·입력 이스케이프를 유지한다', async () => {
    const service = createService({
      RESEND_API_KEY: 'key',
      FEEDBACK_NOTIFY_EMAIL: 'ops@example.com',
      CLIENT_DOMAIN: 'https://bookjeok.com',
      RESEND_FROM_EMAIL: '북적 <notice@example.com>',
    });
    await expect(service.send(feedbackNoticeMail, feedback())).resolves.toEqual(
      { status: 'sent' },
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ops@example.com',
        from: '북적 <notice@example.com>',
        subject: '[북적 문의] 버그 제보 · <script>alert(1)</script> 두 번째 줄',
      }),
    );
    const rendered = send.mock.calls[0][0].html as string;
    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('&lt;script&gt;');
    expect(rendered).toContain('&lt;b&gt;독자&lt;/b&gt;');
    expect(rendered).toContain(
      'https://bookjeok.com/book/search?q=a&amp;b=&lt;c&gt;',
    );
    expect(rendered).toContain('reader@example.com');
  });

  it('책 요청은 책 제목으로 제목줄을 만든다', async () => {
    await createService({
      RESEND_API_KEY: 'key',
      FEEDBACK_NOTIFY_EMAIL: 'ops@example.com',
    }).send(
      feedbackNoticeMail,
      feedback({
        type: FeedbackType.BOOK_REQUEST,
        content: '',
        details: { bookTitle: '급류' },
      }),
    );
    expect(send.mock.calls[0][0].subject).toBe('[북적 문의] 책 요청 · 급류');
  });

  it('탈퇴한 문의 작성자도 운영자에게 알린다', async () => {
    await createService({
      RESEND_API_KEY: 'key',
      FEEDBACK_NOTIFY_EMAIL: 'ops@example.com',
    }).send(feedbackNoticeMail, feedback({ user: null }));
    expect(send.mock.calls[0][0].html).toContain('탈퇴한 회원');
  });

  it('운영자 주소 미설정이면 skip을 반환하고 발송하지 않는다', async () => {
    await expect(
      createService({ RESEND_API_KEY: 'key' }).send(
        feedbackNoticeMail,
        feedback(),
      ),
    ).resolves.toEqual({ status: 'skipped', reason: 'missing-configuration' });
    expect(send).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('feedback-notice'),
    );
  });

  it('채팅 알림의 수신자·제목·홈 링크를 유지하고 모든 동적 값을 이스케이프한다', async () => {
    await createService({
      RESEND_API_KEY: 'key',
      CLIENT_DOMAIN: 'https://bookjeok.com',
    }).send(chatRoomCreatedMail, chat);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe('seller@example.com');
    expect(mail.subject).toBe(
      `[북적] '${chat.bookTitle}' 판매글에 새로운 채팅 문의가 도착했습니다`,
    );
    expect(mail.html).toContain('href="https://bookjeok.com"');
    expect(mail.html).toContain('&lt;b&gt;판매자&lt;/b&gt;');
    expect(mail.html).toContain('&lt;img src=&quot;buyer&quot;&gt;');
    expect(mail.html).toContain('책 &lt;제목&gt; &amp; &quot;인용&quot;');
  });

  it.each([
    [{ email: null, isEmailVerified: true }, 'missing-email'],
    [{ email: 'seller@example.com', isEmailVerified: false }, 'unverified'],
    [{ email: 'deleted_1_123', isEmailVerified: true }, 'deleted'],
  ])('채팅 수신 조건 %j일 때 %s로 건너뛴다', async (recipient, reason) => {
    await expect(
      createService({ RESEND_API_KEY: 'key' }).send(chatRoomCreatedMail, {
        ...chat,
        seller: { ...chat.seller, ...recipient },
      }),
    ).resolves.toEqual({ status: 'skipped', reason });
    expect(send).not.toHaveBeenCalled();
  });

  it('미인증 수신자에게 인증 링크를 보내며 토큰은 URL 인코딩한다', async () => {
    await createService({
      RESEND_API_KEY: 'key',
      CLIENT_DOMAIN: 'https://bookjeok.com',
    }).send(verificationMail, verification);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: verification.email,
        subject: '[북적] 이메일 주소 인증을 완료해주세요',
        from: '북적 <onboarding@resend.dev>',
      }),
    );
    const rendered = send.mock.calls[0][0].html as string;
    expect(rendered).toContain('&lt;b&gt;독자&lt;/b&gt;');
    expect(rendered).toContain(
      'href="https://bookjeok.com/verify-email?token=a%26b%22c"',
    );
    expect(rendered).toContain('24시간 동안 유효');
  });

  it('키가 없으면 기존 콘솔 대체 모드를 logged로 구분한다', async () => {
    // ConfigService는 실제 환경 변수도 읽으므로 이 테스트에서 명시적으로 끈다.
    const config = new ConfigService({ RESEND_API_KEY: '' });
    await expect(
      new MailService(config, new ResendMailDelivery(config)).send(
        verificationMail,
        verification,
      ),
    ).resolves.toEqual({ status: 'logged' });
    expect(send).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Verification Link: http://localhost:3000/verify-email?token=a%26b%22c',
      ),
    );
  });

  it.each(['response', 'exception'])(
    '공급자 %s 실패는 failed로 반환하고 인증 링크를 콘솔에 남기지 않는다',
    async (mode) => {
      if (mode === 'response')
        send.mockResolvedValue({ error: { message: 'rate limited' } });
      else send.mockRejectedValue(new Error('network unavailable'));
      await expect(
        createService({ RESEND_API_KEY: 'key' }).send(
          verificationMail,
          verification,
        ),
      ).resolves.toMatchObject({ status: 'failed', reason: 'delivery' });
      expect(errorSpy).toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    },
  );

  it('새 정의는 공통 서비스 수정 없이 연결하고 동일한 렌더링을 사용한다', async () => {
    const extraMail: MailDefinition<{ title: string }> = {
      name: 'extra',
      recipient: () => ({ email: 'reader@example.com' }),
      render: ({ title }) => ({
        subject: title,
        heading: title,
        body: html`<p>${title}</p>`,
        devInfo: 'extra',
      }),
    };
    await createService({ RESEND_API_KEY: 'key' }).send(extraMail, {
      title: '<b>추가 메일</b>',
    });
    expect(send.mock.calls[0][0].html).toContain(
      '<p>&lt;b&gt;추가 메일&lt;/b&gt;</p>',
    );
    expect(send.mock.calls[0][0].html).toContain('북적 (Bookjeok)');
  });

  it('수신 정책과 렌더링 예외도 실패 결과로 격리한다', async () => {
    const brokenMail: MailDefinition<{}> = {
      name: 'broken',
      recipient: () => ({ email: 'reader@example.com' }),
      render: () => {
        throw new Error('bad template');
      },
    };
    const service = createService({ RESEND_API_KEY: 'key' });
    await expect(service.send(brokenMail, {})).resolves.toEqual({
      status: 'failed',
      reason: 'rendering',
    });
    await expect(
      service.send(
        {
          ...brokenMail,
          recipient: () => {
            throw new Error('bad policy');
          },
        },
        {},
      ),
    ).resolves.toEqual({ status: 'failed', reason: 'rendering' });
    expect(send).not.toHaveBeenCalled();
  });
});

import { FeedbackType } from '@bookjeok/core';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CHAT_ROOM_CREATED_EVENT } from '@/features/chat/events/chat-room-created.event';
import { ChatMailListener } from '@/features/chat/listeners/chat-mail.listener';
import { Feedback } from '@/features/feedback/entities/feedback.entity';
import { FeedbackNotifyListener } from '@/features/feedback/listeners/feedback-notify.listener';
import { MailModule } from '@/shared/mail/mail.module';

const send = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}));

describe('이메일 이벤트 연결', () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ error: null });
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([false, true])(
    '공급자 실패=%s일 때 도메인 이벤트는 완료하고 각 메일은 한 번만 발송한다',
    async (fail) => {
      if (fail) send.mockRejectedValue(new Error('network unavailable'));
      const repository = {
        findOne: jest.fn().mockResolvedValue({
          id: 3,
          type: FeedbackType.BUG,
          content: '문의 내용',
          details: {},
          user: null,
        }),
      };
      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            load: [
              () => ({
                RESEND_API_KEY: 'key',
                FEEDBACK_NOTIFY_EMAIL: 'ops@example.com',
              }),
            ],
          }),
          EventEmitterModule.forRoot(),
          MailModule,
        ],
        providers: [
          ChatMailListener,
          FeedbackNotifyListener,
          { provide: getRepositoryToken(Feedback), useValue: repository },
        ],
      }).compile();
      try {
        await module.init();
        const emitter = module.get(EventEmitter2);
        await emitter.emitAsync(CHAT_ROOM_CREATED_EVENT, {
          seller: {
            id: 1,
            nickname: '판매자',
            email: 'seller@example.com',
            isEmailVerified: true,
          },
          buyerNickname: '구매자',
          bookTitle: '급류',
          chatRoomId: 20,
        });
        await emitter.emitAsync('feedback.created', { feedbackId: 3 });
        // Nest의 구독 wrapper는 async:true의 setImmediate 작업을 반환하지 않는다.
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(repository.findOne).toHaveBeenCalledWith({
          where: { id: 3 },
          relations: { user: true },
        });
        expect(send).toHaveBeenCalledTimes(2);
        expect(send.mock.calls[0][0].to).toBe('seller@example.com');
        expect(send.mock.calls[1][0].to).toBe('ops@example.com');
        if (fail) expect(errorSpy).toHaveBeenCalledTimes(2);
      } finally {
        await module.close();
      }
    },
  );
});

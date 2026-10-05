import type { ChatRoomCreatedEvent } from '@/features/chat/events/chat-room-created.event';
import type { MailDefinition } from '@/shared/mail/mail-definition';
import { verifiedRecipient } from '@/shared/mail/mail-recipient';
import { html, mailButton } from '@/shared/mail/mail-renderer';

export const chatRoomCreatedMail: MailDefinition<ChatRoomCreatedEvent> = {
  name: 'chat-room-created',
  recipient: ({ seller }) => verifiedRecipient(seller),
  render: ({ seller, buyerNickname, bookTitle }, { clientDomain }) => ({
    subject: `[북적] '${bookTitle}' 판매글에 새로운 채팅 문의가 도착했습니다`,
    heading: '새로운 채팅 문의 도착',
    body: html`<p
        style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 20px;"
      >
        안녕하세요, <strong>${seller.nickname}</strong>님.<br />
        등록하신 <strong>'${bookTitle}'</strong> 중고책 판매글에
        <strong>${buyerNickname}</strong>님이 채팅 문의를 보냈습니다.
      </p>
      ${mailButton(clientDomain, '북적 바로가기', 'notification')}`,
    footer:
      '북적 웹사이트에 로그인하시면 우측 하단 채팅 버튼을 통해 실시간으로 구매자와 대화를 나누실 수 있습니다.',
    devInfo: `Chat notification for User #${seller.id}: ${clientDomain}`,
  }),
};

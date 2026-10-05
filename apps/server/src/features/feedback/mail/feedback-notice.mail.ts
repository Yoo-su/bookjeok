import { FeedbackType } from '@bookjeok/core';

import type { MailDefinition } from '@/shared/mail/mail-definition';
import { configuredRecipient } from '@/shared/mail/mail-recipient';
import { html, joinHtml } from '@/shared/mail/mail-renderer';

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  [FeedbackType.BOOK_REQUEST]: '책 요청',
  [FeedbackType.BUG]: '버그 제보',
  [FeedbackType.SUGGESTION]: '기능 제안·개선',
  [FeedbackType.OTHER]: '기타 문의',
};

export interface FeedbackNoticeInput {
  id: number;
  type: FeedbackType;
  content: string;
  user: { id: number; nickname: string; email: string | null } | null;
  details: {
    bookTitle?: string;
    bookAuthor?: string;
    bookPublisher?: string;
    pagePath?: string;
    userAgent?: string;
  } | null;
}

export const feedbackNoticeMail: MailDefinition<FeedbackNoticeInput> = {
  name: 'feedback-notice',
  recipient: (_input, context) =>
    configuredRecipient('FEEDBACK_NOTIFY_EMAIL', context),
  render: (feedback, { clientDomain }) => {
    const typeLabel = FEEDBACK_TYPE_LABELS[feedback.type] ?? feedback.type;
    const { bookTitle, bookAuthor, bookPublisher, pagePath, userAgent } =
      feedback.details ?? {};
    const headline = (bookTitle || feedback.content)
      .replace(/\s+/g, ' ')
      .slice(0, 40);
    const author = feedback.user
      ? `${feedback.user.nickname} (#${feedback.user.id}${feedback.user.email ? `, ${feedback.user.email}` : ''})`
      : '탈퇴한 회원';
    const rows: [string, string | null | undefined][] = [
      ['접수 번호', `#${feedback.id}`],
      ['종류', typeLabel],
      ['작성자', author],
      ['책 제목', bookTitle],
      ['저자', bookAuthor],
      ['출판사', bookPublisher],
      ['보던 페이지', pagePath ? `${clientDomain}${pagePath}` : null],
      ['기기', userAgent],
    ];
    const rowHtml = joinHtml(
      rows.flatMap(([label, value]) =>
        value
          ? [
              html`<tr>
                <td
                  style="padding: 6px 12px 6px 0; color: #78716c; white-space: nowrap; vertical-align: top;"
                >
                  ${label}
                </td>
                <td
                  style="padding: 6px 0; color: #1c1917; word-break: break-all;"
                >
                  ${value}
                </td>
              </tr>`,
            ]
          : [],
      ),
    );
    const contentHtml = feedback.content
      ? html`<div
          style="margin-top: 20px; padding: 16px; background-color: #f5f5f4; border-radius: 10px; font-size: 14px; color: #1c1917; line-height: 1.6; white-space: pre-wrap;"
        >
          ${feedback.content}
        </div>`
      : html``;
    return {
      subject: `[북적 문의] ${typeLabel} · ${headline}`,
      heading: '새 문의가 접수됐습니다',
      layout: 'operator',
      body: html`<table style="font-size: 14px; border-collapse: collapse;">
          ${rowHtml}
        </table>
        ${contentHtml}`,
      devInfo: `Feedback #${feedback.id} (${feedback.type}): ${headline}`,
    };
  },
};

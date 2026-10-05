import type { MailHtml } from '@/shared/mail/mail-renderer';

export type MailSkipReason =
  | 'missing-email'
  | 'unverified'
  | 'deleted'
  | 'missing-configuration';
export type MailRecipient = { email: string } | { reason: MailSkipReason };

export interface MailContext {
  clientDomain: string;
  getConfig: (key: string) => string | undefined;
}

export interface MailTemplate {
  subject: string;
  heading: string;
  body: MailHtml;
  footer?: string;
  layout?: 'customer' | 'operator';
  devInfo: string;
}

/** 정의 하나가 입력 계약·수신 정책·본문을 소유한다. 이벤트 연결은 도메인에 둔다. */
export interface MailDefinition<Input> {
  name: string;
  recipient: (input: Input, context: MailContext) => MailRecipient;
  render: (input: Input, context: MailContext) => MailTemplate;
}

export type MailDeliveryResult =
  | { status: 'sent' }
  | { status: 'logged' }
  | { status: 'failed'; reason: 'delivery'; detail: string };

export type MailResult =
  | MailDeliveryResult
  | { status: 'skipped'; reason: MailSkipReason }
  | { status: 'failed'; reason: 'rendering' };

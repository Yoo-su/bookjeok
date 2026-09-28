import { FeedbackType } from '@bookjeok/core';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type { Feedback } from '@/features/feedback/entities/feedback.entity';
import { User } from '@/features/user/entities/user.entity';

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  [FeedbackType.BOOK_REQUEST]: '책 요청',
  [FeedbackType.BUG]: '버그 제보',
  [FeedbackType.SUGGESTION]: '기능 제안·개선',
  [FeedbackType.OTHER]: '기타 문의',
};

/** 사용자 입력을 메일 HTML에 넣기 전 이스케이프 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly clientDomain: string;
  private readonly feedbackNotifyEmail: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not set. Emails will be logged to console in dev fallback mode.',
      );
    }
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ??
      '북적 <onboarding@resend.dev>';
    this.clientDomain =
      this.configService.get<string>('CLIENT_DOMAIN') ??
      'http://localhost:3000';
    this.feedbackNotifyEmail = this.configService.get<string>(
      'FEEDBACK_NOTIFY_EMAIL',
    );
  }

  /**
   * 이메일 인증 링크를 포함한 인증 메일을 전송합니다.
   * @param to 수신자 이메일
   * @param nickname 사용자 닉네임
   * @param token 인증 토큰
   */
  async sendVerificationEmail(
    to: string,
    nickname: string,
    token: string,
  ): Promise<boolean> {
    const verificationUrl = `${this.clientDomain}/verify-email?token=${token}`;

    const subject = '[북적] 이메일 주소 인증을 완료해주세요';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background-color: #fcfbf9;">
        <div style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 700; color: #1c1917; letter-spacing: -0.5px;">북적 (Bookjeok)</span>
          </div>
          <h1 style="font-size: 20px; font-weight: 600; color: #1c1917; margin-bottom: 16px; letter-spacing: -0.3px;">이메일 인증 요청</h1>
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 24px;">
            안녕하세요, <strong>${nickname}</strong>님.<br/>
            북적 서비스를 안전하고 편리하게 이용하시려면 아래 버튼을 눌러 이메일 인증을 완료해주세요.
          </p>
          <div style="margin-bottom: 32px; text-align: center;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: -0.2px;">이메일 인증하기</a>
          </div>
          <p style="font-size: 13px; color: #78716c; line-height: 1.5; margin-bottom: 12px;">
            버튼이 클릭되지 않는 경우 아래 링크를 브라우저 주소창에 직접 입력해주세요:
          </p>
          <p style="font-size: 12px; color: #059669; word-break: break-all; margin-bottom: 24px; padding: 10px; background-color: #f5f5f4; border-radius: 6px;">
            ${verificationUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #f5f5f4; margin: 24px 0;" />
          <p style="font-size: 12px; color: #a8a29e; line-height: 1.4; margin: 0;">
            본인이 요청한 이메일 인증이 아니라면 이 메일을 무시하셔도 됩니다. 인증 링크는 24시간 동안 유효합니다.
          </p>
        </div>
      </div>
    `;

    return this.sendMail(
      to,
      subject,
      html,
      `Verification Link: ${verificationUrl}`,
    );
  }

  /**
   * 중고책 판매글에 새로운 채팅방이 열렸을 때 판매자에게 알림 메일을 전송합니다.
   * [Verification Guard]: 수신자가 이메일 인증을 완료한(isEmailVerified === true) 경우에만 발송합니다.
   */
  async sendChatRoomCreatedNotification(
    seller: User,
    buyerNickname: string,
    bookTitle: string,
    chatRoomId: number,
  ): Promise<boolean> {
    // 1. 발송 가드: 이메일 미존재 또는 미인증 사용자 시 발송 건너뜀
    if (
      !seller.email ||
      !seller.isEmailVerified ||
      seller.email.startsWith('deleted_')
    ) {
      this.logger.debug(
        `Skipped chat notification: User #${seller.id} (${seller.email}) is not email-verified or deleted.`,
      );
      return false;
    }

    const serviceUrl = this.clientDomain;
    const subject = `[북적] '${bookTitle}' 판매글에 새로운 채팅 문의가 도착했습니다`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background-color: #fcfbf9;">
        <div style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 700; color: #1c1917; letter-spacing: -0.5px;">북적 (Bookjeok)</span>
          </div>
          <h1 style="font-size: 20px; font-weight: 600; color: #1c1917; margin-bottom: 16px; letter-spacing: -0.3px;">새로운 채팅 문의 도착</h1>
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 20px;">
            안녕하세요, <strong>${seller.nickname}</strong>님.<br/>
            등록하신 <strong>'${bookTitle}'</strong> 중고책 판매글에 <strong>${buyerNickname}</strong>님이 채팅 문의를 보냈습니다.
          </p>
          <div style="margin-bottom: 28px; text-align: center;">
            <a href="${serviceUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: -0.2px;">북적 바로가기</a>
          </div>
          <hr style="border: none; border-top: 1px solid #f5f5f4; margin: 24px 0;" />
          <p style="font-size: 12px; color: #a8a29e; line-height: 1.4; margin: 0;">
            북적 웹사이트에 로그인하시면 우측 하단 채팅 버튼을 통해 실시간으로 구매자와 대화를 나누실 수 있습니다.
          </p>
        </div>
      </div>
    `;

    return this.sendMail(
      seller.email,
      subject,
      html,
      `Chat notification for User #${seller.id}: ${serviceUrl}`,
    );
  }

  /**
   * 사용자 문의·제보를 운영자에게 알립니다.
   * FEEDBACK_NOTIFY_EMAIL이 없으면 보내지 않습니다 (문의는 DB에 남음).
   */
  async sendFeedbackNotice(feedback: Feedback): Promise<boolean> {
    if (!this.feedbackNotifyEmail) {
      this.logger.warn(
        `FEEDBACK_NOTIFY_EMAIL is not set. Feedback #${feedback.id} was saved without notice.`,
      );
      return false;
    }

    const typeLabel = FEEDBACK_TYPE_LABELS[feedback.type] ?? feedback.type;
    const { bookTitle, bookAuthor, bookPublisher, pagePath, userAgent } =
      feedback.details ?? {};
    const headline = (bookTitle || feedback.content)
      .replace(/\s+/g, ' ')
      .slice(0, 40);
    const subject = `[북적 문의] ${typeLabel} · ${headline}`;

    const author = feedback.user
      ? `${feedback.user.nickname} (#${feedback.user.id}${feedback.user.email ? `, ${feedback.user.email}` : ''})`
      : '탈퇴한 회원';
    const pageUrl = pagePath ? `${this.clientDomain}${pagePath}` : null;

    const rows: [string, string | null | undefined][] = [
      ['접수 번호', `#${feedback.id}`],
      ['종류', typeLabel],
      ['작성자', author],
      ['책 제목', bookTitle],
      ['저자', bookAuthor],
      ['출판사', bookPublisher],
      ['보던 페이지', pageUrl],
      ['기기', userAgent],
    ];
    const rowHtml = rows
      .filter(([, value]) => value)
      .map(
        ([label, value]) => `
          <tr>
            <td style="padding: 6px 12px 6px 0; color: #78716c; white-space: nowrap; vertical-align: top;">${label}</td>
            <td style="padding: 6px 0; color: #1c1917; word-break: break-all;">${escapeHtml(value as string)}</td>
          </tr>`,
      )
      .join('');
    const contentHtml = feedback.content
      ? `<div style="margin-top: 20px; padding: 16px; background-color: #f5f5f4; border-radius: 10px; font-size: 14px; color: #1c1917; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(feedback.content)}</div>`
      : '';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #fcfbf9;">
        <div style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 28px;">
          <h1 style="font-size: 18px; font-weight: 600; color: #1c1917; margin: 0 0 16px;">새 문의가 접수됐습니다</h1>
          <table style="font-size: 14px; border-collapse: collapse;">${rowHtml}</table>
          ${contentHtml}
        </div>
      </div>
    `;

    return this.sendMail(
      this.feedbackNotifyEmail,
      subject,
      html,
      `Feedback #${feedback.id} (${feedback.type}): ${headline}`,
    );
  }

  /**
   * 실제 메일 전송 로직 (Resend API 또는 개발 모드 Fallback 콘솔 출력)
   */
  private async sendMail(
    to: string,
    subject: string,
    html: string,
    devInfo: string,
  ): Promise<boolean> {
    if (this.resend) {
      try {
        const { error } = await this.resend.emails.send({
          from: this.fromEmail,
          to,
          subject,
          html,
        });

        if (error) {
          this.logger.error(`Resend API Error sending mail to ${to}:`, error);
          this.logDevFallback(to, subject, devInfo);
          return false;
        }

        this.logger.log(`Email successfully sent to ${to} via Resend.`);
        return true;
      } catch (err) {
        this.logger.error(`Failed to send email to ${to}:`, err);
        this.logDevFallback(to, subject, devInfo);
        return false;
      }
    } else {
      this.logDevFallback(to, subject, devInfo);
      return true;
    }
  }

  private logDevFallback(to: string, subject: string, devInfo: string) {
    this.logger.log(
      `\n================ [MAIL SERVICE DEV LOG] ================\nTo: ${to}\nSubject: ${subject}\nInfo: ${devInfo}\n========================================================\n`,
    );
  }
}

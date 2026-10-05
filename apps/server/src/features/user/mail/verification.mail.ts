import type { MailDefinition } from '@/shared/mail/mail-definition';
import { html, mailButton } from '@/shared/mail/mail-renderer';

export interface VerificationMailInput {
  email: string;
  nickname: string;
  token: string;
}

export const verificationMail: MailDefinition<VerificationMailInput> = {
  name: 'verification',
  // 인증 메일에는 일반 알림의 이메일 인증 조건을 적용하지 않는다.
  recipient: ({ email }) => ({ email }),
  render: ({ nickname, token }, { clientDomain }) => {
    const url = `${clientDomain}/verify-email?token=${encodeURIComponent(token)}`;
    return {
      subject: '[북적] 이메일 주소 인증을 완료해주세요',
      heading: '이메일 인증 요청',
      body: html`<p
          style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 24px;"
        >
          안녕하세요, <strong>${nickname}</strong>님.<br />
          북적 서비스를 안전하고 편리하게 이용하시려면 아래 버튼을 눌러 이메일
          인증을 완료해주세요.
        </p>
        ${mailButton(url, '이메일 인증하기', 'verification')}
        <p
          style="font-size: 13px; color: #78716c; line-height: 1.5; margin-bottom: 12px;"
        >
          버튼이 클릭되지 않는 경우 아래 링크를 브라우저 주소창에 직접
          입력해주세요:
        </p>
        <p
          style="font-size: 12px; color: #059669; word-break: break-all; margin-bottom: 24px; padding: 10px; background-color: #f5f5f4; border-radius: 6px;"
        >
          ${url}
        </p>`,
      footer:
        '본인이 요청한 이메일 인증이 아니라면 이 메일을 무시하셔도 됩니다. 인증 링크는 24시간 동안 유효합니다.',
      devInfo: `Verification Link: ${url}`,
    };
  },
};

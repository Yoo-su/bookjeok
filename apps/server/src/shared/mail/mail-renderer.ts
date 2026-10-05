import type { MailTemplate } from '@/shared/mail/mail-definition';

const trustedHtml = Symbol('mail-html');

/** 외부 문자열로 만들지 않고 html 태그가 만든 조각만 중첩한다. */
export interface MailHtml {
  readonly [trustedHtml]: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type HtmlValue = string | number | MailHtml;

/** 텍스트·속성의 동적 값은 기본 이스케이프, html 조각만 그대로 조립한다. */
export function html(
  strings: TemplateStringsArray,
  ...values: HtmlValue[]
): MailHtml {
  return {
    [trustedHtml]: strings.reduce((result, part, index) => {
      const value = values[index];
      if (value === undefined) return result + part;
      return (
        result +
        part +
        (typeof value === 'object'
          ? value[trustedHtml]
          : escapeHtml(String(value)))
      );
    }, ''),
  };
}

export function joinHtml(fragments: MailHtml[]): MailHtml {
  return { [trustedHtml]: fragments.map((part) => part[trustedHtml]).join('') };
}

export function mailButton(
  url: string,
  label: string,
  tone: 'verification' | 'notification',
): MailHtml {
  const color = tone === 'verification' ? '#059669' : '#1c1917';
  const margin = tone === 'verification' ? '32px' : '28px';
  return html`<div style="margin-bottom: ${margin}; text-align: center;">
    <a
      href="${url}"
      style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: -0.2px;"
      >${label}</a
    >
  </div>`;
}

export function renderMail(template: MailTemplate): string {
  const operator = template.layout === 'operator';
  const padding = operator ? '32px 20px' : '40px 20px';
  const cardPadding = operator ? '28px' : '36px 32px';
  const shadow = operator ? '' : 'box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);';
  const brand = operator
    ? html``
    : html`<div style="margin-bottom: 24px;">
        <span
          style="font-size: 22px; font-weight: 700; color: #1c1917; letter-spacing: -0.5px;"
          >북적 (Bookjeok)</span
        >
      </div>`;
  const headingStyle = operator
    ? 'font-size: 18px; font-weight: 600; color: #1c1917; margin: 0 0 16px;'
    : 'font-size: 20px; font-weight: 600; color: #1c1917; margin-bottom: 16px; letter-spacing: -0.3px;';
  const footer = template.footer
    ? html`<hr
          style="border: none; border-top: 1px solid #f5f5f4; margin: 24px 0;"
        />
        <p
          style="font-size: 12px; color: #a8a29e; line-height: 1.4; margin: 0;"
        >
          ${template.footer}
        </p>`
    : html``;
  return html`<div
    style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: ${padding}; background-color: #fcfbf9;"
  >
    <div
      style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: ${cardPadding}; ${shadow}"
    >
      ${brand}
      <h1 style="${headingStyle}">${template.heading}</h1>
      ${template.body}${footer}
    </div>
  </div>`[trustedHtml];
}

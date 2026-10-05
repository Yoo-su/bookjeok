import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  MailContext,
  MailDefinition,
  MailResult,
} from '@/shared/mail/mail-definition';
import { renderMail } from '@/shared/mail/mail-renderer';
import { ResendMailDelivery } from '@/shared/mail/resend-mail-delivery';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly context: MailContext;

  constructor(
    config: ConfigService,
    private readonly delivery: ResendMailDelivery,
  ) {
    this.context = {
      clientDomain:
        config.get<string>('CLIENT_DOMAIN') ?? 'http://localhost:3000',
      getConfig: (key) => config.get<string>(key),
    };
  }

  /** 모든 실패를 결과로 돌려준다. 요청 실패 여부는 호출 도메인이 결정한다. */
  async send<Input>(
    definition: MailDefinition<Input>,
    input: NoInfer<Input>,
  ): Promise<MailResult> {
    try {
      const recipient = definition.recipient(input, this.context);
      if ('reason' in recipient) {
        const message = `Skipped ${definition.name}: ${recipient.reason}.`;
        if (recipient.reason === 'missing-configuration')
          this.logger.warn(message);
        else this.logger.debug(message);
        return { status: 'skipped', reason: recipient.reason };
      }
      const template = definition.render(input, this.context);
      const result = await this.delivery.send({
        to: recipient.email,
        subject: template.subject,
        html: renderMail(template),
        devInfo: template.devInfo,
      });
      if (result.status === 'failed')
        this.logger.error(
          `Failed to send ${definition.name}: ${result.detail}`,
        );
      else if (result.status === 'sent')
        this.logger.log(
          `Email ${definition.name} successfully sent via Resend.`,
        );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to prepare ${definition.name}: ${error instanceof Error ? error.message : 'Unknown preparation error'}`,
      );
      return { status: 'failed', reason: 'rendering' };
    }
  }
}

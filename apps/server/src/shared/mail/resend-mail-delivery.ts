import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type { MailDeliveryResult } from '@/shared/mail/mail-definition';

interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  devInfo: string;
}

@Injectable()
export class ResendMailDelivery {
  private readonly logger = new Logger(ResendMailDelivery.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail =
      config.get<string>('RESEND_FROM_EMAIL') ?? '북적 <onboarding@resend.dev>';
    if (!this.resend)
      this.logger.warn(
        'RESEND_API_KEY is not set. Emails will be logged to console in dev fallback mode.',
      );
  }

  async send(mail: OutgoingMail): Promise<MailDeliveryResult> {
    if (!this.resend) {
      this.logger.log(
        `\n================ [MAIL SERVICE DEV LOG] ================\nTo: ${mail.to}\nSubject: ${mail.subject}\nInfo: ${mail.devInfo}\n========================================================\n`,
      );
      return { status: 'logged' };
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
      });
      return error
        ? { status: 'failed', reason: 'delivery', detail: error.message }
        : { status: 'sent' };
    } catch (error) {
      return {
        status: 'failed',
        reason: 'delivery',
        detail:
          error instanceof Error ? error.message : 'Unknown delivery error',
      };
    }
  }
}

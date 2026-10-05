import { Global, Module } from '@nestjs/common';

import { MailService } from '@/shared/mail/mail.service';
import { ResendMailDelivery } from '@/shared/mail/resend-mail-delivery';

@Global()
@Module({
  providers: [MailService, ResendMailDelivery],
  exports: [MailService],
})
export class MailModule {}

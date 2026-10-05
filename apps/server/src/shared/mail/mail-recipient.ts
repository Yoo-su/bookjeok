import type { MailContext, MailRecipient } from '@/shared/mail/mail-definition';

export interface EmailRecipient {
  email: string | null;
  isEmailVerified: boolean;
}

export function verifiedRecipient(user: EmailRecipient): MailRecipient {
  if (!user.email) return { reason: 'missing-email' };
  if (user.email.startsWith('deleted_')) return { reason: 'deleted' };
  if (!user.isEmailVerified) return { reason: 'unverified' };
  return { email: user.email };
}

export function configuredRecipient(
  key: string,
  context: MailContext,
): MailRecipient {
  const email = context.getConfig(key);
  return email ? { email } : { reason: 'missing-configuration' };
}

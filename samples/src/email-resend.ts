// Typechecked, not run: real provider, attachments, unsubscribe headers.
import { batchAttachments, createMailer, ResendProvider, unsubscribeHeaders, type Attachment } from '@27colab/email-kit';

const mailer = createMailer({
  provider: new ResendProvider({ apiKey: process.env.RESEND_API_KEY! }),
  from: 'Acme <hello@example.com>',
});

export async function sendReport(to: string, files: Attachment[]) {
  const { batches, oversized } = batchAttachments(files, { maxBytes: 15 * 1024 * 1024, maxCount: 10 });
  for (const batch of batches) await mailer.send({ to, subject: 'Your files', text: 'Attached.', attachments: batch });
  return oversized; // too big on their own: send these as links
}

export const headers = unsubscribeHeaders({ httpsUrl: 'https://example.com/unsubscribe/abc' });

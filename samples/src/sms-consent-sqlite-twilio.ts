// Typechecked, not run: storage and webhook wiring.
import Database from 'better-sqlite3';
import { SqliteConsentStore, defaultReplies, handleTwilioInbound } from '@27colab/sms-consent';

const store = new SqliteConsentStore(new Database('consent.db'));
const replies = defaultReplies('Acme', 'help@example.test');

// Inside your POST handler for the Twilio messaging webhook:
export async function onTwilioWebhook(rawFormBody: string, signature: string | undefined, publicWebhookUrl: string) {
  const res = await handleTwilioInbound({
    store,
    accountId: 'acct-1',
    replies,
    body: rawFormBody,
    verify: { authToken: process.env.TWILIO_AUTH_TOKEN!, url: publicWebhookUrl, signature },
  });
  return res; // respond with res.status, res.contentType, res.body
}

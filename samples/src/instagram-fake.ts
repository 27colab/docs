import { createWebhookHandler, InstagramClient } from '@27colab/instagram-dm';
import { FakeGraphApi, textEvent } from '@27colab/instagram-dm/testing';

const accountId = '1000000000001';
const userId = '2000000000002';

const fake = new FakeGraphApi({ appSecret: 'test' });
const client = new InstagramClient({ accessToken: fake.issueToken(accountId), fetch: fake.fetch });

const webhook = createWebhookHandler({
  appSecret: 'test',
  verifyToken: 'verify-me',
  resolveClient: () => client,
  conversation: { onMessage: ({ event }) => `You said: ${event.text}` },
});

// A user messaged us "just now", so the 24-hour window is open.
fake.recordInbound(accountId, userId);
const { rawBody, headers } = fake.buildWebhook(
  [textEvent({ accountId, userId, mid: 'm1', text: 'hi' })],
  accountId,
);

const ok = await webhook.handle({ method: 'POST', headers, rawBody });
console.log(ok.status, fake.sent.map((m) => m.text));

// Same bytes again (a redelivery): acknowledged, not answered twice.
await webhook.handle({ method: 'POST', headers, rawBody });
console.log('replies after redelivery:', fake.sent.filter((m) => m.text).length);

// Tampered body: rejected before your code runs.
const bad = await webhook.handle({ method: 'POST', headers, rawBody: rawBody.replace('hi', 'yo') });
console.log(bad.status);

// Keyless: every provider is one of the packages' fakes. Run: npm run loopback
import { createCallSession } from '@27colab/voice-engine';
import { FakeChat, FakeStt, FakeTransport, FakeTts } from '@27colab/voice-engine/testing';
import { MemoryConsentStore, applyConsentEvent, defaultReplies, handleInbound } from '@27colab/sms-consent';
import { createMailer } from '@27colab/email-kit';
import { FakeProvider } from '@27colab/email-kit/testing';
import { createWebhookHandler, InstagramClient } from '@27colab/instagram-dm';
import { FakeGraphApi, textEvent } from '@27colab/instagram-dm/testing';
import { makeExecutor, system, tools, type AgentDeps } from './agent.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- shared state and fakes ------------------------------------------------
const consent = new MemoryConsentStore();
const smsOutbox: Array<{ to: string; body: string }> = [];
const emailProvider = new FakeProvider();
const deps: AgentDeps = {
  consent,
  sendSms: async (to, body) => void smsOutbox.push({ to, body }),
  mailer: createMailer({ provider: emailProvider, from: 'Acme Dental <hello@example.com>' }),
  accountId: 'acct-1',
  timeZone: 'America/New_York',
  now: () => new Date('2026-03-10T17:00:00Z'), // 1 pm local, outside quiet hours
};
const caller = '+15550001111';

// --- a phone call: voice-engine around your tools --------------------------
async function runCall(callId: string, script: (chat: FakeChat) => void, utterance: string) {
  const transport = new FakeTransport({ autoConfirmMarks: true });
  const stt = new FakeStt();
  const chat = new FakeChat();
  script(chat);
  const executor = makeExecutor(deps, caller);

  const session = createCallSession(
    { transport, sttFactory: stt, ttsFactory: new FakeTts({ msPerChar: 5 }), chat },
    { callId, startedAt: new Date() },
    { onEnd: () => {} },
    {
      languages: ['en'],
      greeting: 'Acme Dental, how can I help?',
      system: () => system('en'),
      llm: { model: 'scripted', maxTokens: 200 },
      tools,
      executeTool: executor,
      voice: { provider: 'fake', voices: {}, defaultVoiceId: 'v', model: 'fake', outputFormat: 'ulaw_8000' },
      stt: { model: 'fake' },
    },
  );
  await session.start();
  await sleep(50);
  stt.last.emitEndOfTurn(utterance);
  await sleep(150);
  await session.end('caller_hangup');
  return chat;
}

// 1. The caller opted in on a web form earlier.
await applyConsentEvent(consent, deps.accountId, caller, { type: 'grant', source: 'web-form' });
await runCall(
  'call-1',
  (chat) =>
    chat
      .pushToolCall('text_me_details', { body: 'Acme Dental: you are booked for Tue 3pm.' })
      .pushToolCall('email_me_this', { address: 'jane dot doe at example dot com', confirmed: true, subject: 'Your visit', text: 'Tue 3pm.' })
      .pushText('Done: I texted and emailed you the details.'),
  'Please text and email me the details',
);
console.log('call 1 -> SMS:', smsOutbox.map((m) => m.body));
console.log('call 1 -> email to:', emailProvider.outbox.map((e) => e.message.to));

// 2. The recipient texts STOP. Your Twilio webhook calls handleInbound.
const stop = await handleInbound({ store: consent, accountId: deps.accountId, from: caller, body: 'STOP', replies: defaultReplies('Acme Dental') });
console.log('inbound STOP ->', stop.record?.status);

// 3. Next call: the same tool call is refused, and the tool result says so.
const before = smsOutbox.length;
const call2 = await runCall(
  'call-2',
  (chat) => chat.pushToolCall('text_me_details', { body: 'Reminder: Tue 3pm.' }).pushText('I could not text you, but your visit is Tue 3pm.'),
  'Text me a reminder',
);
console.log('call 2 -> SMS sent:', smsOutbox.length - before);
const lastTurn = JSON.parse(call2.seenMessages.at(-1)!) as Array<{ content: unknown }>;
console.log('call 2 -> what the model was told:', JSON.stringify(lastTurn.at(-1)?.content));

// --- an Instagram DM: instagram-dm around the same kind of agent -----------
const fake = new FakeGraphApi({ appSecret: 'test' });
const igClient = new InstagramClient({ accessToken: fake.issueToken('1000000000001'), fetch: fake.fetch });
const webhook = createWebhookHandler({
  appSecret: 'test',
  verifyToken: 'verify-me',
  resolveClient: () => igClient,
  conversation: { onMessage: async ({ event }) => `Acme Dental: thanks for writing ("${event.text}"). A teammate will confirm your visit.` },
});
fake.recordInbound('1000000000001', '2000000000002');
const hook = fake.buildWebhook([textEvent({ accountId: '1000000000001', userId: '2000000000002', mid: 'm1', text: 'Can I move my visit?' })], '1000000000001');
await webhook.handle({ method: 'POST', headers: hook.headers, rawBody: hook.rawBody });
console.log('instagram reply:', fake.sent.map((m) => m.text));

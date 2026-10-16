import { createCallSession } from '@27colab/voice-engine';
import { FakeChat, FakeStt, FakeTransport, FakeTts } from '@27colab/voice-engine/testing';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const transport = new FakeTransport();
const stt = new FakeStt();
const tts = new FakeTts({ msPerChar: 60 });
const chat = new FakeChat()
  .pushText('We have openings Monday morning, Tuesday afternoon, and Wednesday evening if any of those work.')
  .pushText('No problem, what day works better for you?');

const session = createCallSession(
  { transport, sttFactory: stt, ttsFactory: tts, chat },
  { callId: 'demo-call', startedAt: new Date() },
  { onEnd: (record, reason) => console.log(`call ended (${reason}); barge-ins: ${record.stats.bargeIns}`) },
  {
    languages: ['en'],
    greeting: 'Hi, thanks for calling Acme. How can I help?',
    system: 'You are a concise front-desk assistant.',
    llm: { model: 'scripted', maxTokens: 200 },
    voice: { provider: 'fake', voices: {}, defaultVoiceId: 'any-voice-id', model: 'fake', outputFormat: 'ulaw_8000' },
    stt: { model: 'fake' },
  },
);

await session.start();
await sleep(20);
await sleep(20);
transport.confirmAllMarks(); // the greeting finished playing
await sleep(20);

stt.last.emitEagerEndOfTurn('Do you have any openings this week?');
await sleep(5);
stt.last.emitEndOfTurn('Do you have any openings this week?');
await sleep(20);

// The caller "hears" about 2 s of the agent's answer, then talks over it.
const base = transport.totalQueuedMs - tts.last.totalMs;
transport.confirmPlayedMs(base + 2000);
await sleep(5);
stt.last.emitEndOfTurn('Actually, never mind, thanks');
await sleep(20);

const next = JSON.parse(chat.seenMessages[1]!) as Array<{ role: string; content: unknown }>;
console.log('history sent to the model on the next turn:');
for (const m of next) console.log(`  ${m.role.padEnd(9)} ${JSON.stringify(m.content)}`);

transport.confirmAllMarks();
await sleep(20);
await session.end('caller_hangup');

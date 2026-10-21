// Needs real keys; typechecked here, not run. Bring your own wss server (ws shown).
import { WebSocketServer } from 'ws';
import { createCallSession, TwilioMediaTransport } from '@27colab/voice-engine';
import { createAnthropicChat, createDeepgramFluxFactory, createElevenLabsFactory } from '@27colab/voice-engine/providers';

const env = process.env;
const sttFactory = createDeepgramFluxFactory(env.DEEPGRAM_API_KEY!);
const ttsFactory = createElevenLabsFactory(env.ELEVENLABS_API_KEY!);
const chat = createAnthropicChat(env.ANTHROPIC_API_KEY!); // caches system prompt + history by default

const RULES = 'You are a concise phone assistant for Acme Air. Opening hours: Mon-Fri 8 to 6.';

const wss = new WebSocketServer({ port: 8080, path: '/media' });

wss.on('connection', async (ws) => {
  const transport = new TwilioMediaTransport(ws);
  const start = await transport.started; // streamSid, callSid, custom <Parameter>s

  const session = createCallSession(
    { transport, sttFactory, ttsFactory, chat },
    { callId: start.callSid, startedAt: new Date() },
    {
      onEnd: (record) => console.log(`[${record.callId}]`, JSON.stringify(record.stats.usage)),
      onWarning: (message) => console.warn(message),
    },
    {
      languages: ['en', 'es'],
      languagePolicy: 'follow-caller',
      greeting: { en: 'Hi, how can I help?', es: 'Hola, ¿en qué puedo ayudarle?' },
      // Cached up to the boundary; the time after it changes every turn.
      system: (lang, now) => [
        { text: `${RULES} Reply in ${lang === 'es' ? 'Spanish' : 'English'}.`, cacheBoundary: true },
        { text: `It is now ${now.toLocaleString('en-US', { timeZone: 'America/New_York' })}.` },
      ],
      llm: { model: 'claude-haiku-4-5', maxTokens: 300 },
      tools: [{ name: 'check_hours', description: 'Check today\'s opening hours.', input_schema: { type: 'object', properties: {} } }],
      executeTool: async () => ({ content: 'Open today 8 to 6.' }),
      fillers: { check_hours: { en: 'One moment.', es: 'Un momento.' } },
      voice: {
        provider: 'elevenlabs',
        voices: { en: env.ELEVENLABS_VOICE_EN, es: env.ELEVENLABS_VOICE_ES },
        defaultVoiceId: env.ELEVENLABS_VOICE_EN!,
        model: 'eleven_flash_v2_5',
        outputFormat: 'ulaw_8000',
      },
      stt: { model: 'flux-general-multi', eagerEotThreshold: 0.6 },
    },
  );
  await session.start();
});

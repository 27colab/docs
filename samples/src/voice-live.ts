// Needs real keys; typechecked here, not run. Bring your own wss server (ws shown).
import { WebSocketServer } from 'ws';
import { createCallSession, TwilioMediaTransport } from '@27colab/voice-engine';
import { createAnthropicChat, createDeepgramFluxFactory, createElevenLabsFactory } from '@27colab/voice-engine/providers';

const env = process.env;
const sttFactory = createDeepgramFluxFactory(env.DEEPGRAM_API_KEY!);
const ttsFactory = createElevenLabsFactory(env.ELEVENLABS_API_KEY!);
const chat = createAnthropicChat(env.ANTHROPIC_API_KEY!);

const wss = new WebSocketServer({ port: 8080, path: '/media' });

wss.on('connection', async (ws) => {
  const transport = new TwilioMediaTransport(ws);
  const start = await transport.started; // streamSid, callSid, custom <Parameter>s

  const session = createCallSession(
    { transport, sttFactory, ttsFactory, chat },
    { callId: start.callSid, startedAt: new Date() },
    { onEnd: (record) => console.log(`[${record.callId}]`, JSON.stringify(record.stats)) },
    {
      languages: ['en', 'es'],
      languagePolicy: 'follow-caller',
      greeting: { en: 'Hi, how can I help?', es: 'Hola, ¿en qué puedo ayudarle?' },
      system: (lang) => `You are a concise phone assistant. Reply in ${lang === 'es' ? 'Spanish' : 'English'}.`,
      llm: { model: 'claude-haiku-4-5', maxTokens: 300 },
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

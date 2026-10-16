// Typechecked, not run: the same agent with real providers. You supply every key.
import { WebSocketServer } from 'ws';
import { createCallSession, TwilioMediaTransport } from '@27colab/voice-engine';
import { createAnthropicChat, createDeepgramFluxFactory, createElevenLabsFactory } from '@27colab/voice-engine/providers';
import { SqliteConsentStore } from '@27colab/sms-consent';
import { createMailer, ResendProvider } from '@27colab/email-kit';
import Database from 'better-sqlite3';
import { makeExecutor, system, tools, type AgentDeps } from './agent.js';

const env = process.env;

const deps: AgentDeps = {
  consent: new SqliteConsentStore(new Database('consent.db')),
  sendSms: async (to, body) => {
    // Twilio REST API; no SDK required. Your Account SID, Auth Token, and sender number.
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: env.TWILIO_FROM!, Body: body }),
    });
    if (!res.ok) throw new Error(`Twilio ${res.status}`); // sendGuarded turns this into sent: false
  },
  mailer: createMailer({ provider: new ResendProvider({ apiKey: env.RESEND_API_KEY! }), from: 'Acme Dental <hello@example.com>' }),
  accountId: 'acct-1',
  timeZone: 'America/New_York',
};

const sttFactory = createDeepgramFluxFactory(env.DEEPGRAM_API_KEY!);
const ttsFactory = createElevenLabsFactory(env.ELEVENLABS_API_KEY!);
const chat = createAnthropicChat(env.ANTHROPIC_API_KEY!);

new WebSocketServer({ port: 8080, path: '/media' }).on('connection', async (ws) => {
  const transport = new TwilioMediaTransport(ws);
  const start = await transport.started;
  const callerPhone = start.customParameters.from!; // <Parameter name="from" value="{{From}}"/> in your TwiML

  const session = createCallSession(
    { transport, sttFactory, ttsFactory, chat },
    { callId: start.callSid, startedAt: new Date() },
    { onEnd: (record) => console.log(record.callId, record.stats) },
    {
      languages: ['en', 'es'],
      languagePolicy: 'follow-caller',
      greeting: { en: 'Acme Dental, how can I help?', es: 'Acme Dental, ¿en qué puedo ayudarle?' },
      system: (lang) => system(lang),
      llm: { model: 'claude-haiku-4-5', maxTokens: 300 },
      tools,
      executeTool: makeExecutor(deps, callerPhone),
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

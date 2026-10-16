// YOUR code. The packages never see your prompt, your model choice or your business rules.
import type { ToolDef, ToolExecutor } from '@27colab/voice-engine';
import { ensureOptOutFooter, sendGuarded, type ConsentStore } from '@27colab/sms-consent';
import { createEmailMeThis } from '@27colab/email-kit';
import type { Mailer } from '@27colab/email-kit';

export const system = (lang: 'en' | 'es') =>
  `You are the front-desk assistant for Acme Dental. Reply in ${lang === 'es' ? 'Spanish' : 'English'}, ` +
  'in one or two short sentences. Only say you sent something after the tool result says it was sent.';

export const tools: ToolDef[] = [
  {
    name: 'text_me_details',
    description: 'Text the caller the appointment details. Only works if they have opted in.',
    input_schema: { type: 'object', properties: { body: { type: 'string' } }, required: ['body'] },
  },
  {
    name: 'email_me_this',
    description: 'Email the caller their own details. Read the address back and get a yes first.',
    input_schema: {
      type: 'object',
      properties: { address: { type: 'string' }, confirmed: { type: 'boolean' }, subject: { type: 'string' }, text: { type: 'string' } },
      required: ['address', 'confirmed', 'subject', 'text'],
    },
  },
];

export interface AgentDeps {
  consent: ConsentStore;
  /** Your SMS provider call (Twilio, etc.): (to, body) => Promise<void>. */
  sendSms: (to: string, body: string) => Promise<void>;
  mailer: Mailer;
  accountId: string;
  timeZone: string;
  now?: () => Date;
}

/** One executor per call. `callerPhone` comes from a <Parameter> in your TwiML. */
export function makeExecutor(deps: AgentDeps, callerPhone: string): ToolExecutor {
  const emailMeThis = createEmailMeThis(deps.mailer, { locale: 'en' });
  return async (name, input, ctx) => {
    if (name === 'text_me_details') {
      const { body } = input as { body: string };
      const r = await sendGuarded({
        store: deps.consent,
        accountId: deps.accountId,
        phone: callerPhone,
        timeZone: deps.timeZone,
        now: deps.now?.(),
        body: ensureOptOutFooter(body),
        send: deps.sendSms,
      });
      // The model only learns "sent" when the guard allowed it AND the provider resolved.
      return r.sent
        ? { content: 'Text sent.' }
        : { content: `Text NOT sent (${r.reason}). Do not tell the caller it was sent.`, isError: true };
    }
    if (name === 'email_me_this') {
      const a = input as { address: string; confirmed: boolean; subject: string; text: string };
      const out = await emailMeThis({ ...a, requestId: ctx.callId });
      if (out.status === 'needs-confirmation') return { content: `Read this back and ask for a yes: ${out.readBack}` };
      if (out.status === 'sent') return { content: 'Email sent.' };
      return { content: `Email NOT sent (${out.status}).`, isError: true };
    }
    return { content: `Unknown tool ${name}`, isError: true };
  };
}

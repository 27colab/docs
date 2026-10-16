import { createMailer, MemorySuppressionList, defineTemplate, createEmailMeThis } from '@27colab/email-kit';
import { FakeProvider } from '@27colab/email-kit/testing';

const provider = new FakeProvider().failNext(2); // two transient failures, then success
const suppression = new MemorySuppressionList();
const mailer = createMailer({ provider, from: 'Acme <hello@example.com>', suppression });

const welcome = defineTemplate<{ name: string }>({
  id: 'welcome',
  defaultLocale: 'en',
  locales: {
    en: { subject: 'Welcome', text: 'Hi {{name}}!', html: '<p>Hi {{name}}!</p>' },
    es: { subject: 'Bienvenido', text: '¡Hola {{name}}!', html: '<p>¡Hola {{name}}!</p>' },
  },
});

await mailer.sendTemplate(welcome, 'ana@example.com', { name: 'Ana' }, { locale: 'es-MX' }); // falls back to "es"
console.log(provider.calls, 'provider calls;', provider.outbox[0]?.message.subject);

// Same content to the same recipient dedupes by default.
await mailer.sendTemplate(welcome, 'ana@example.com', { name: 'Ana' }, { locale: 'es-MX' });
console.log('emails recorded:', provider.outbox.length);

// Suppressed recipients are refused before the provider is called.
await suppression.add('stop@example.com', 'unsubscribed');
await mailer.send({ to: 'stop@example.com', subject: 's', text: 't' }).catch((e) => console.log('refused:', e.reason));

// "Email me this" for chat and voice bots.
const emailMeThis = createEmailMeThis(mailer, { locale: 'en' });
const msg = { address: 'jane dot doe at example dot com', subject: 'Your notes', text: 'Here they are.', requestId: 'call-42-turn-3' };
console.log(await emailMeThis({ ...msg, confirmed: false })); // read it back first
console.log((await emailMeThis({ ...msg, confirmed: true })).status);
console.log((await emailMeThis({ ...msg, confirmed: true })).status, 'again; outbox:', provider.outbox.length);

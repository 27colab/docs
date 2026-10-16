import {
  MemoryConsentStore, applyConsentEvent, ensureOptOutFooter, handleInbound, defaultReplies, sendGuarded,
} from '@27colab/sms-consent';

const store = new MemoryConsentStore();
const outbox: Array<{ to: string; body: string }> = [];
// Replace with your provider call (Twilio, etc.). It is a plain function.
const send = async (to: string, body: string) => void outbox.push({ to, body });

const accountId = 'acct-1';
const phone = '+15550001111';
const tz = 'America/New_York';
const noon = new Date('2026-03-10T17:00:00Z'); // 1 pm in New York: outside quiet hours

// 1. Before any consent, a normal message is refused and never reaches the provider.
console.log(await sendGuarded({ store, accountId, phone, timeZone: tz, now: noon, body: ensureOptOutFooter('Your order shipped.'), send }));

// 2. Double opt-in: request, then the recipient replies YES.
await applyConsentEvent(store, accountId, phone, { type: 'request_opt_in' });
await sendGuarded({
  store, accountId, phone, timeZone: tz, now: noon, kind: 'opt_in_request', send,
  body: 'Acme: Reply YES to get texts. Msg & data rates may apply. Reply STOP to opt out.',
});
const replies = defaultReplies('Acme', 'help@example.test');
console.log((await handleInbound({ store, accountId, from: phone, body: 'yes', replies })).record?.status);

// 3. Now a message goes out, unless it lands in quiet hours.
console.log(await sendGuarded({ store, accountId, phone, timeZone: tz, now: noon, body: ensureOptOutFooter('Your order shipped.'), send }));
const night = new Date('2026-03-11T03:30:00Z'); // 11:30 pm in New York
console.log(await sendGuarded({ store, accountId, phone, timeZone: tz, now: night, body: ensureOptOutFooter('Late nudge.'), send }));

// 4. STOP wins, and the confirmation is a `reply`.
const stop = await handleInbound({ store, accountId, from: phone, body: 'Please stop', replies });
console.log(stop.keyword, stop.record?.status);
console.log(await sendGuarded({ store, accountId, phone, timeZone: tz, now: noon, body: ensureOptOutFooter('One more thing.'), send }));

console.log('provider calls:', outbox.length);

---
title: "Which package do I need?"
description: "A short chooser for the six packages, with an honest list of who each one is not for."
---

| If you need to… | Use | Look elsewhere if… |
|---|---|---|
| Stop a phone agent talking over the caller, and rewrite its memory to what was actually heard | [voice-engine](/packages/voice-engine/) | you want a complete hosted voice platform (Vapi, Retell, LiveKit Agents, Pipecat) |
| Record who agreed to texts, honor STOP, and refuse unsafe sends | [sms-consent](/packages/sms-consent/) | you need legal sign-off on a messaging program; this is a reference implementation, not legal advice |
| Receive and answer Instagram DMs from your own bot | [instagram-dm](/packages/instagram-dm/) | you want a chatbot framework, or Meta's own tooling |
| Send transactional email without double-sends or mailing suppressed addresses | [email-kit](/packages/email-kit/) | you need SMTP, a template designer, queues or inbound parsing |
| Connect an app to QuickBooks Online and keep the tokens healthy | [quickbooks-online-kit](/integrations/quickbooks-online-kit/) | you need the long tail of QBO entities, reports, batch or CDC |
| Pre-fill a Florida folio number and legal description from an address | [fl-parcel-lookup](/integrations/fl-parcel-lookup/) | the result goes on a legal filing without checking the deed, or you need another county |

## How the voice and messaging packages combine

The four voice and messaging packages are independent: you can install any one on its own. They are designed to sit around your own agent code, which is where the prompt, model choice and business rules live. The [assembly guide](/guides/assemble/) shows one way to wire them together, with a demo that needs no keys.

## What none of them include

No hosted service, no prompt library, no tenant model, no dashboard, no telephony provisioning, no billing. Several are extracted from patterns in private projects and rewritten clean; where that is true the package README says so, and so does its page here.

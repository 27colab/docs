---
title: "How samples are verified"
description: "Every code sample on this site lives in a typechecked workspace and, where it needs no keys, is executed with its output recorded."
---

The code on these pages is not pasted from READMEs. It is embedded from the `samples/` folder of the [docs repository](https://github.com/27colab/docs/tree/main/samples), which depends on the six packages and is checked by CI.

- **Typechecked.** `npm run samples:typecheck` compiles every sample against the packages' type declarations in strict mode. If an API changes, the build of the docs repo fails before a stale example is published.
- **Executed, where possible.** Samples that use only the packages' in-memory fakes run with `npm run samples:run`. The output shown on each page is the recorded stdout of that run, so what you read is what the code printed.
- **Typechecked only, never run.** Samples that need real accounts and keys (live Twilio, Deepgram, ElevenLabs, Anthropic, Meta, Resend, Intuit, county GIS services) are checked for type correctness but not executed. They are marked **“needs keys”** on the page.

## What this does not prove

Passing against a fake proves the package behaves as its own tests say. It does not prove the real provider still behaves the way the fake imitates. Provider message shapes can drift; each package page lists its own caveats.

## Run them yourself

```sh
git clone https://github.com/27colab/docs && cd docs
npm install
npm run samples:install
npm run samples:typecheck
npm run samples:run
```

The samples depend on the packages by path (`file:../../<package>`) during development and by npm version once they are published.

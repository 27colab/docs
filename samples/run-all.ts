// Runs every keyless sample and records its stdout in samples/out/ (the docs embed those files).
// A non-zero exit means a documented example broke.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const keyless = [
  'voice-loopback', 'sms-consent-quickstart', 'instagram-fake', 'email-quickstart',
  'qbo-fake', 'parcel-lookup', 'assistant/loopback',
];
mkdirSync('out', { recursive: true });
let failed = 0;
for (const name of keyless) {
  const r = spawnSync('npx', ['tsx', `src/${name}.ts`], { encoding: 'utf8' });
  console.log(`=== ${name} (exit ${r.status})`);
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) failed++;
  else writeFileSync(`out/${name.replace('/', '-')}.txt`, r.stdout);
}
process.exit(failed ? 1 : 0);

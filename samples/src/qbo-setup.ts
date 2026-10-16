// Typechecked, not run: real configuration against an Intuit sandbox app.
import { createQuickBooks, FileTokenStore, JsonlAuditLog } from '@27colab/quickbooks-online-kit';
import { createRouteHandlers } from '@27colab/quickbooks-online-kit/next';

export const qbo = createQuickBooks({
  clientId: process.env.QBO_CLIENT_ID!,
  clientSecret: process.env.QBO_CLIENT_SECRET!,
  redirectUri: `${process.env.APP_URL}/api/quickbooks/callback`,
  environment: process.env.QBO_ENVIRONMENT, // 'sandbox' (default) | 'production'
  stateSecret: process.env.QBO_STATE_SECRET!, // any long random string
  store: new FileTokenStore('.data/qbo-tokens.json'),
  audit: new JsonlAuditLog('.data/qbo-audit.jsonl'),
});

declare function isAdmin(req: Request): Promise<boolean>;

// app/api/quickbooks/[action]/route.ts
const h = createRouteHandlers({
  kit: qbo,
  authorize: async (req) => isAdmin(req), // REQUIRED: your own session check
  redirectAfterCallback: (r) => (r.ok ? '/admin/quickbooks?connected=1' : `/admin/quickbooks?error=${encodeURIComponent(r.error)}`),
});
export const GET = h.GET;
export const POST = h.POST;

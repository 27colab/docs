import { createWebhookHandler, InstagramClient } from '@27colab/instagram-dm';

// IG account id -> client. Load the access tokens from YOUR store.
const clients = new Map<string, InstagramClient>();

export const webhook = createWebhookHandler({
  appSecret: process.env.META_APP_SECRET!,
  verifyToken: process.env.META_VERIFY_TOKEN!,
  resolveClient: (accountId) => clients.get(accountId),
  conversation: {
    async onMessage({ event }) {
      if (event.storyReply) return 'Thanks for replying to our story!';
      if (!event.text) return 'I can only read text for now.';
      return `You said: ${event.text}`; // your logic (or an LLM call) goes here
    },
  },
});

// Next.js route handler (app/api/instagram/route.ts):
export const GET = webhook.fetch;
export const POST = webhook.fetch;

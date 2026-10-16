import { createQuickBooks, MemoryTokenStore, QboError } from '@27colab/quickbooks-online-kit';
import { startFakeQbo } from '@27colab/quickbooks-online-kit/testing';

const fake = await startFakeQbo();
try {
  const qbo = createQuickBooks({
    clientId: fake.clientId,
    clientSecret: fake.clientSecret,
    redirectUri: 'http://localhost:3000/api/quickbooks/callback',
    stateSecret: 'any-long-random-string',
    store: new MemoryTokenStore(),
    endpoints: fake.endpoints, // point the kit at the in-process fake
  });

  // The connect flow, with the "consent screen" played by the fake.
  const state = new URL(qbo.connectUrl()).searchParams.get('state')!;
  const cb = new URL('http://localhost:3000/api/quickbooks/callback');
  cb.searchParams.set('code', fake.issueAuthCode());
  cb.searchParams.set('state', state);
  cb.searchParams.set('realmId', fake.realmId);
  await qbo.handleCallback(cb.toString());
  const status = await qbo.status();
  console.log('connected:', status.connected, status.environment);

  const { client } = qbo;
  const { customer } = await client.findOrCreateCustomer({ givenName: 'Ada', familyName: 'Example', email: 'ada@example.com' });
  fake.db.Item!.push({ Id: '900', Name: 'Consulting', UnitPrice: 150, Type: 'Service', Active: true });
  const prices = await client.buildPriceMap();
  const consulting = prices['Consulting']!;

  const estimate = await client.createEstimate({
    customerId: customer.Id,
    lines: [{ itemId: consulting.id, qty: 2, unitPrice: consulting.unitPrice }],
  });
  const invoice = await client.convertEstimateToInvoice(estimate.Id);
  await client.convertEstimateToInvoice(estimate.Id).catch((e) => console.log('second conversion:', e instanceof QboError ? e.code : e));
  await client.recordPayment({ customerId: customer.Id, invoiceId: invoice.Id, amount: invoice.TotalAmt });
  console.log('invoice total', invoice.TotalAmt);

  fake.expireAccessTokens(); // server-side expiry: the kit refreshes once and retries
  console.log((await qbo.testConnection()).connected, 'refreshes:', fake.tokenCalls.refresh_token);
} finally {
  await fake.close();
}

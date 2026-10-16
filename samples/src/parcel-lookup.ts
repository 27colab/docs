import { createClient, normalizeAddress, type Fetch } from '@27colab/fl-parcel-lookup';

// 1. Address normalisation is pure and offline.
const n = normalizeAddress('100 Northwest 7th Street Apt 4B, Miami, FL 33125');
console.log(n.county, n.unit, n.search['miami-dade'], n.search['palm-beach']);

// 2. A lookup against a stubbed county service (invented data, no network).
const stub: Fetch = async () =>
  new Response(
    JSON.stringify({
      features: [
        {
          attributes: {
            FOLIO: '0100000000010',
            LEGAL: 'EXAMPLE PARK SUBD PB 1-1 LOT 5 BLK 2',
            TRUE_SITE_ADDR: '100 NW 7 ST',
            TRUE_SITE_ZIP_CODE: '33125-0000',
          },
          centroid: { x: -80.2, y: 25.78 },
        },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

const parcels = createClient({ fetch: stub });
const parcel = await parcels.lookupByAddress('100 NW 7th St, Miami, FL 33125');
console.log(parcel?.folio, parcel?.county, parcel?.legal, 'ambiguous:', parcel?.ambiguous);

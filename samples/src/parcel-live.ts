// Typechecked, not run: hits the real county services.
import { lookupByAddress, lookupByFolio, searchByAddress, UnsupportedCountyError } from '@27colab/fl-parcel-lookup';

try {
  const parcel = await lookupByAddress('100 NW 7th St Apt 4B, Miami, FL 33125');
  if (parcel) console.log(parcel.folio, parcel.legal, parcel.source.url, parcel.unitMatched);

  const all = await searchByAddress('100 NW 7th St, Miami, FL 33125'); // every unit of a condo
  console.log(all.length);

  console.log(await lookupByFolio('01-0000-000-0010')); // dashes accepted
} catch (e) {
  if (e instanceof UnsupportedCountyError) console.log('Not Miami-Dade, Broward or Palm Beach');
  else throw e;
}

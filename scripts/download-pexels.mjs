/**
 * Downloads Pexels images for all 12 places in MOCK_PLACES.
 * Run: node scripts/download-pexels.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PEXELS_API_KEY = 'SK0CN8f7zUUXBKT9C7fcZVrCRSbPKMrOErMpwbSpaS5CqVsTeKMIqF7N';
const PEXELS_SEARCH = 'https://api.pexels.com/v1/search';

const PLACES = [
  { id: 'central-park',     query: 'Central Park New York scenic landscape' },
  { id: 'lotus-cafe',       query: 'cozy cafe interior coffee shop' },
  { id: 'riverside-walk',   query: 'riverside walkway scenic river view' },
  { id: 'art-district',     query: 'street art mural urban district' },
  { id: 'spice-market',     query: 'spice market colorful spices' },
  { id: 'rooftop-lounge',   query: 'rooftop lounge bar city view evening' },
  { id: 'heritage-quarter', query: 'heritage architecture historic quarter' },
  { id: 'night-bazaar',     query: 'night market vibrant colorful stalls' },
  { id: 'baga-beach',       query: 'Baga Beach Goa tropical beach' },
  { id: 'calangute-beach',  query: 'Calangute Beach Goa sandy shore' },
  { id: 'fort-aguada',      query: 'Fort Aguada Goa historic fort' },
  { id: 'anjuna-market',    query: 'Anjuna Goa flea market beach' },
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'public', 'places');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  console.log(`  ✓ ${path.basename(dest)} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  for (const place of PLACES) {
    const dest = path.join(OUT, `${place.id}.jpg`);
    console.log(`\n${place.id} — searching "${place.query}"`);

    const params = new URLSearchParams({ query: place.query, per_page: '1', orientation: 'landscape' });
    const res = await fetch(`${PEXELS_SEARCH}?${params}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      console.error(`  ✗ API error: ${res.status} ${res.statusText}`);
      continue;
    }

    const data = await res.json();
    if (!data.photos?.length) {
      console.error(`  ✗ No photos found`);
      continue;
    }

    const photo = data.photos[0];
    const imageUrl = photo.src.large; // ~940×650, good quality
    console.log(`  → ${photo.photographer}: ${imageUrl}`);

    try {
      await download(imageUrl, dest);
    } catch (err) {
      console.error(`  ✗ Download failed: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);

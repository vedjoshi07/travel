/**
 * NEXUS Simulation Engine
 * Pure, deterministic functions — same seed + timestamp = same output.
 * This is the data layer for the demo. Swap one file (the hooks) to connect a real API.
 */

export interface SimClock {
  realTime: Date;
  simTimeOffsetMinutes: number; // for demo fast-forward
}

export interface PlaceSimState {
  placeId: string;
  crowdPercent: number;      // 0–100
  queueMinutes: number;
  noiseLevel: 'quiet' | 'comfortable' | 'loud';
  experienceScore: number;   // 0–100 composite
  trend: 'up' | 'down' | 'flat';
}

export interface CitySimState {
  weatherC: number;
  weatherLabel: string;
  weatherIcon: string;
  trafficLevel: 'low' | 'medium' | 'high';
  safetyScore: number;
  activeEvents: number;
  airQuality: 'good' | 'moderate' | 'poor';
}

// ─── Seeded pseudo-random (deterministic per placeId) ───────────────────────

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return (h >>> 0) / 0xFFFFFFFF; // 0–1
}

/** Seeded noise in range [0, amplitude] */
function seededNoise(placeId: string, salt: string, amplitude: number): number {
  return hashString(placeId + salt) * amplitude;
}

// ─── Time-of-day crowd curve ─────────────────────────────────────────────────

/**
 * Returns a 0–1 crowd intensity based on hour-of-day.
 * Two sine-wave peaks: lunch (~13:00) and evening (~19:00).
 */
function timeCrowdBase(hourFractional: number): number {
  const lunchPeak = Math.sin(Math.PI * ((hourFractional - 10) / 6));   // peaks at 13h
  const eveningPeak = Math.sin(Math.PI * ((hourFractional - 16) / 6)); // peaks at 19h
  const raw =
    Math.max(0, lunchPeak) * 0.7 +
    Math.max(0, eveningPeak) * 1.0;
  return Math.min(1, Math.max(0, raw));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getPlaceState(placeId: string, clock: SimClock): PlaceSimState {
  const simMinutes =
    clock.realTime.getHours() * 60 +
    clock.realTime.getMinutes() +
    clock.simTimeOffsetMinutes;
  const hourFractional = (simMinutes % (24 * 60)) / 60;

  // Personality offsets — each place has a different baseline character
  const baseOffset = seededNoise(placeId, 'base', 0.3) - 0.15;
  const noiseAmp = seededNoise(placeId, 'amp', 0.2);

  // Time-varying noise that shifts slowly (changes every ~10 min)
  const timeSlot = Math.floor(simMinutes / 10);
  const slowNoise = (hashString(placeId + timeSlot) - 0.5) * noiseAmp;

  const crowdRaw = Math.min(
    1,
    Math.max(0, timeCrowdBase(hourFractional) + baseOffset + slowNoise)
  );
  const crowdPercent = Math.round(crowdRaw * 100);

  // Queue: 0 at low crowd, up to 30 min at peak
  const queueMinutes = Math.round(crowdRaw * crowdRaw * 30 + seededNoise(placeId, 'queue', 5));

  // Noise level
  const noiseLevel: PlaceSimState['noiseLevel'] =
    crowdPercent > 70 ? 'loud' : crowdPercent > 35 ? 'comfortable' : 'quiet';

  // Experience = high when crowd is moderate (30–60%), drops at extremes
  const crowdPenalty = Math.abs(crowdPercent - 45) / 45; // 0 = perfect, 1 = worst
  const baseSatisfaction = seededNoise(placeId, 'sat', 20) + 60;
  const experienceScore = Math.round(
    Math.max(10, Math.min(100, baseSatisfaction - crowdPenalty * 40))
  );

  // Trend: compare to 15 min ago
  const prevHour = ((simMinutes - 15) % (24 * 60)) / 60;
  const prevCrowd = timeCrowdBase(prevHour) + baseOffset;
  const diff = crowdRaw - prevCrowd;
  const trend: PlaceSimState['trend'] = diff > 0.03 ? 'up' : diff < -0.03 ? 'down' : 'flat';

  return { placeId, crowdPercent, queueMinutes, noiseLevel, experienceScore, trend };
}

export function getCityState(
  _coords: { lat: number; lng: number },
  clock: SimClock
): CitySimState {
  const hour = clock.realTime.getHours() + clock.simTimeOffsetMinutes / 60;
  const simH = hour % 24;

  // Weather — cycles slowly through day
  const tempBase = 22 + Math.sin((simH - 6) * Math.PI / 12) * 6;
  const weatherC = Math.round(tempBase * 10) / 10;

  const weatherLabel =
    weatherC > 30 ? 'Hot & Sunny' :
    weatherC > 25 ? 'Warm' :
    weatherC > 18 ? 'Pleasant' :
    weatherC > 12 ? 'Cool' : 'Cold';

  const weatherIcon =
    weatherC > 28 ? '☀️' : weatherC > 22 ? '🌤️' : weatherC > 16 ? '⛅' : '🌥️';

  // Traffic peaks at commute hours
  const trafficIntensity =
    (simH >= 8 && simH < 10) || (simH >= 17 && simH < 20) ? 'high' :
    (simH >= 10 && simH < 17) ? 'medium' : 'low';

  const safetyScore = 78 + Math.round(Math.sin(simH * 0.5) * 8);
  const activeEvents = 3 + Math.floor(hashString(`events-${Math.floor(simH)}`) * 5);
  const airQuality: CitySimState['airQuality'] = simH > 8 && simH < 20 ? 'moderate' : 'good';

  return {
    weatherC,
    weatherLabel,
    weatherIcon,
    trafficLevel: trafficIntensity,
    safetyScore,
    activeEvents,
    airQuality,
  };
}

export function getForecast(placeId: string, hoursAhead: number, clock: SimClock): PlaceSimState[] {
  return Array.from({ length: hoursAhead }, (_, i) => {
    const futureClock: SimClock = {
      realTime: clock.realTime,
      simTimeOffsetMinutes: clock.simTimeOffsetMinutes + i * 60,
    };
    return getPlaceState(placeId, futureClock);
  });
}

// ─── Mock place catalogue ─────────────────────────────────────────────────────
//
// `imageUrl` and `imageCredit` reference freely-licensed Wikimedia Commons
// photographs that have been downloaded to public/places/ at build time.
// Keeping them local means:
//  - the deployed static site loads them at /travel/places/<id>.jpg
//  - we never depend on a third-party CDN at runtime
//  - the images are committed to the repo so a fresh clone has them
//
// `PlaceImage` falls back to a category-tinted gradient if the file is missing.

export const MOCK_PLACES = [
  {
    id: 'central-park',     name: 'Central Park',       category: 'Park',
    distanceM: 420,  lat: 28.6139, lng: 77.2090,
    imageUrl: '/places/central-park.jpg',
    imageCredit: 'Central Park by Anthony Quintano / Wikimedia Commons (CC BY 2.0)',
    // Persona hints — keep the data layer expressive but stable so every
    // page that renders this place agrees on its character.
    priceTier: 1 as const,          // free / very cheap
    vibeTags: ['quiet', 'open', 'free'] as string[],
  },
  {
    id: 'lotus-cafe',       name: 'Lotus Café',         category: 'Café',
    distanceM: 180,  lat: 28.6145, lng: 77.2095,
    imageUrl: '/places/lotus-cafe.jpg',
    imageCredit: 'Café interior — Wikimedia Commons (CC BY-SA)',
    priceTier: 2 as const,
    vibeTags: ['cozy', 'coffee'] as string[],
  },
  {
    id: 'riverside-walk',   name: 'Riverside Walk',     category: 'Walk',
    distanceM: 750,  lat: 28.6130, lng: 77.2070,
    imageUrl: '/places/riverside-walk.jpg',
    imageCredit: 'Walkway Over the Hudson by Famartin / Wikimedia Commons (CC BY-SA 4.0)',
    priceTier: 1 as const,
    vibeTags: ['peaceful', 'outdoors', 'free'] as string[],
  },
  {
    id: 'art-district',     name: 'Art District',       category: 'Culture',
    distanceM: 1200, lat: 28.6160, lng: 77.2110,
    imageUrl: '/places/art-district.jpg',
    imageCredit: 'Lodhi Art District mural — Wikimedia Commons (CC BY-SA)',
    priceTier: 2 as const,
    vibeTags: ['creative', 'indoor', 'cultural'] as string[],
  },
  {
    id: 'spice-market',     name: 'Spice Market',       category: 'Market',
    distanceM: 600,  lat: 28.6135, lng: 77.2080,
    imageUrl: '/places/spice-market.jpg',
    imageCredit: 'Khari Baoli by Gopal Dudeja / Wikimedia Commons (CC BY-SA 4.0)',
    priceTier: 1 as const,
    vibeTags: ['lively', 'food', 'shopping'] as string[],
  },
  {
    id: 'rooftop-lounge',   name: 'Rooftop Lounge',     category: 'Bar',
    distanceM: 320,  lat: 28.6148, lng: 77.2100,
    imageUrl: '/places/rooftop-lounge.jpg',
    imageCredit: 'Sky Bar — Wikimedia Commons (CC BY-SA)',
    priceTier: 3 as const,
    vibeTags: ['evening', 'drinks', 'view'] as string[],
  },
  {
    id: 'heritage-quarter', name: 'Heritage Quarter',   category: 'Culture',
    distanceM: 950,  lat: 28.6120, lng: 77.2060,
    imageUrl: '/places/heritage-quarter.jpg',
    imageCredit: 'Shahjahanabad — Wikimedia Commons (Public Domain)',
    priceTier: 1 as const,
    vibeTags: ['historical', 'walking', 'cultural'] as string[],
  },
  {
    id: 'night-bazaar',     name: 'Night Bazaar',       category: 'Market',
    distanceM: 1100, lat: 28.6155, lng: 77.2105,
    imageUrl: '/places/night-bazaar.jpg',
    imageCredit: 'Shilin Night Market — Wikimedia Commons (CC BY-SA)',
    priceTier: 2 as const,
    vibeTags: ['lively', 'evening', 'shopping'] as string[],
  },
  {
    id: 'baga-beach',       name: 'Baga Beach',         category: 'Beach',
    distanceM: 1500, lat: 15.5524, lng: 73.7516,
    imageUrl: '/places/baga-beach.jpg',
    imageCredit: 'Baga Beach, Goa by Bernard Gagnon / Wikimedia Commons (CC BY-SA 3.0)',
    priceTier: 1 as const,
    vibeTags: ['outdoors', 'sunset', 'free'] as string[],
  },
  {
    id: 'calangute-beach',  name: 'Calangute Beach',    category: 'Beach',
    distanceM: 2200, lat: 15.5442, lng: 73.7553,
    imageUrl: '/places/calangute-beach.jpg',
    imageCredit: 'Calangute sunset — Wikimedia Commons (CC BY-SA)',
    priceTier: 1 as const,
    vibeTags: ['outdoors', 'sunset', 'free'] as string[],
  },
  {
    id: 'fort-aguada',      name: 'Fort Aguada',        category: 'Culture',
    distanceM: 4500, lat: 15.4924, lng: 73.7737,
    imageUrl: '/places/fort-aguada.jpg',
    imageCredit: 'Fort Aguada — Wikimedia Commons (CC BY-SA)',
    priceTier: 1 as const,
    vibeTags: ['historical', 'view', 'cultural'] as string[],
  },
  {
    id: 'anjuna-market',    name: 'Anjuna Flea Market', category: 'Market',
    distanceM: 3800, lat: 15.5798, lng: 73.7386,
    imageUrl: '/places/anjuna-market.jpg',
    imageCredit: 'Anjuna Beach, Goa by Yathin S Krishnappa / Wikimedia Commons (CC BY-SA 3.0)',
    priceTier: 1 as const,
    vibeTags: ['lively', 'shopping', 'weekend'] as string[],
  },
] as const;


export type PlaceId = typeof MOCK_PLACES[number]['id'];

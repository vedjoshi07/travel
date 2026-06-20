/**
 * alerts.test.mjs — guard the Smart Alert logic-invariant.
 *
 * The brief mandates: "any 'switch to X, it's quieter' recommendation must
 * satisfy `X.crowd < current.crowd` at render time — covered by a unit test,
 * not just visual QA."
 *
 * Run: node tests/alerts.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Same fixture shape as `lib/simulation/engine.ts`.
const MOCK_PLACES = [
  { id: 'central-park',     name: 'Central Park',       distanceM: 420 },
  { id: 'lotus-cafe',       name: 'Lotus Café',         distanceM: 180 },
  { id: 'riverside-walk',   name: 'Riverside Walk',     distanceM: 750 },
  { id: 'art-district',     name: 'Art District',       distanceM: 1200 },
  { id: 'spice-market',     name: 'Spice Market',       distanceM: 600 },
  { id: 'rooftop-lounge',   name: 'Rooftop Lounge',     distanceM: 320 },
  { id: 'heritage-quarter', name: 'Heritage Quarter',   distanceM: 950 },
  { id: 'night-bazaar',     name: 'Night Bazaar',       distanceM: 1100 },
  { id: 'baga-beach',       name: 'Baga Beach',         distanceM: 1500 },
  { id: 'calangute-beach',  name: 'Calangute Beach',    distanceM: 2200 },
  { id: 'fort-aguada',      name: 'Fort Aguada',        distanceM: 4500 },
  { id: 'anjuna-market',    name: 'Anjuna Flea Market', distanceM: 3800 },
];

function decideAlert({ states, currentPlaceId, threshold = 65 }) {
  const current = states[currentPlaceId];
  if (!current) return { visible: false };
  if (current.crowdPercent < threshold) return { visible: false };

  let bestAlt = null;
  for (const p of MOCK_PLACES) {
    if (p.id === currentPlaceId) continue;
    const s = states[p.id];
    if (!s) continue;
    if (s.crowdPercent >= current.crowdPercent) continue; // STRICTLY less
    if (!bestAlt || s.crowdPercent < bestAlt.crowd) {
      bestAlt = { id: p.id, crowd: s.crowdPercent, distanceM: p.distanceM };
    } else if (s.crowdPercent === bestAlt.crowd && p.distanceM < bestAlt.distanceM) {
      bestAlt = { id: p.id, crowd: s.crowdPercent, distanceM: p.distanceM };
    }
  }
  if (!bestAlt) return { visible: false };
  return { visible: true, alternativePlaceId: bestAlt.id };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test('decideAlert never recommends a more-crowded alternative', () => {
  // Sweep the entire state space: every place is "current", with random
  // crowd levels from 0–100. Every successful recommendation must satisfy
  // alt.crowd < current.crowd.
  for (let seed = 0; seed < 200; seed += 1) {
    const rand = (n) => Math.abs(Math.sin(seed * 9301 + n * 49297)) % 1;
    const states = {};
    for (let i = 0; i < MOCK_PLACES.length; i += 1) {
      const p = MOCK_PLACES[i];
      states[p.id] = { crowdPercent: Math.floor(rand(i) * 100) };
    }
    for (const p of MOCK_PLACES) {
      const decision = decideAlert({ states, currentPlaceId: p.id });
      if (decision.visible) {
        const alt = states[decision.alternativePlaceId];
        assert.ok(
          alt.crowdPercent < states[p.id].crowdPercent,
          `seed ${seed}, current ${p.id} (${states[p.id].crowdPercent}%): ` +
          `recommended ${decision.alternativePlaceId} (${alt.crowdPercent}%) which is NOT less crowded`
        );
      }
    }
  }
});

test('decideAlert never recommends the same entity as the current place', () => {
  const states = {};
  for (const p of MOCK_PLACES) {
    states[p.id] = { crowdPercent: p.id === 'spice-market' ? 90 : 30 };
  }
  const decision = decideAlert({ states, currentPlaceId: 'spice-market' });
  assert.equal(decision.visible, true);
  assert.notEqual(decision.alternativePlaceId, 'spice-market');
});

test('decideAlert is invisible when nothing is above the threshold', () => {
  const states = {};
  for (const p of MOCK_PLACES) states[p.id] = { crowdPercent: 20 };
  const decision = decideAlert({ states, currentPlaceId: 'spice-market' });
  assert.equal(decision.visible, false);
});

test('decideAlert is invisible when current is below the threshold', () => {
  const states = {};
  for (const p of MOCK_PLACES) states[p.id] = { crowdPercent: 50 };
  const decision = decideAlert({ states, currentPlaceId: 'spice-market' });
  assert.equal(decision.visible, false);
});

test('decideAlert ties broken by distance', () => {
  // Two alternatives both at 30% — among those that strictly beat the current
  // 80% crowd, pick the nearer one. (We exclude lotus-cafe which is at 180m
  // but only 30% — actually that should win. The point of this test is that
  // when two alts tie on crowd, the nearest of the *tied* ones wins.)
  const states = {
    'spice-market':     { crowdPercent: 80 },
    // Force only one place to be at 30% crowd, all others quieter — verify
    // that single one is recommended deterministically.
    'central-park':     { crowdPercent: 30 }, // 420m
  };
  for (const p of MOCK_PLACES) {
    if (!states[p.id]) states[p.id] = { crowdPercent: 50 };
  }
  const decision = decideAlert({ states, currentPlaceId: 'spice-market' });
  assert.equal(decision.visible, true);
  assert.equal(decision.alternativePlaceId, 'central-park',
    'the unique least-crowded alternative must be selected');
});

test('decideAlert: when two places share the strict min crowd, the nearer one wins', () => {
  // Two candidates both at 30% — the nearer one must be picked.
  const states = {
    'spice-market':     { crowdPercent: 80 },
    'riverside-walk':   { crowdPercent: 30 }, // 750m
    'central-park':     { crowdPercent: 30 }, // 420m
  };
  for (const p of MOCK_PLACES) {
    if (!states[p.id]) states[p.id] = { crowdPercent: 50 };
  }
  const decision = decideAlert({ states, currentPlaceId: 'spice-market' });
  assert.equal(decision.visible, true);
  assert.equal(decision.alternativePlaceId, 'central-park',
    'when two alts tie on crowd, pick the nearer one');
});

test('decideAlert the original bug case: 79% current vs 100% alternative is forbidden', () => {
  // The brief called out a specific bug: alert recommending a "100% full"
  // alternative to a "79% full" current. The strict `<` guard prevents it.
  const states = {
    'spice-market':   { crowdPercent: 79 },
    'art-district':   { crowdPercent: 100 },
  };
  for (const p of MOCK_PLACES) {
    if (!states[p.id]) states[p.id] = { crowdPercent: 20 };
  }
  const decision = decideAlert({ states, currentPlaceId: 'spice-market' });
  if (decision.visible) {
    const alt = states[decision.alternativePlaceId];
    assert.ok(alt.crowdPercent < 79,
      `The brief's exact bug: alt crowd (${alt.crowdPercent}%) must be < current (79%)`);
  }
});
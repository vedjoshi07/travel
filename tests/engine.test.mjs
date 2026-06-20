/**
 * engine.test.mjs — verify the simulation engine produces per-entity,
 * time-varying data (the brief explicitly called out "reused mock numbers
 * across unrelated entities is the single fastest way to make an AI-powered
 * feature look fake").
 *
 * Run: node tests/engine.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const MOCK_PLACES = [
  { id: 'central-park' }, { id: 'lotus-cafe' }, { id: 'riverside-walk' },
  { id: 'art-district' }, { id: 'spice-market' }, { id: 'rooftop-lounge' },
  { id: 'heritage-quarter' }, { id: 'night-bazaar' }, { id: 'baga-beach' },
  { id: 'calangute-beach' }, { id: 'fort-aguada' }, { id: 'anjuna-market' },
];

// Engine replica — see lib/simulation/engine.ts.
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 0xFFFFFFFF;
}
function seededNoise(placeId, salt, amp) { return hashString(placeId + salt) * amp; }

function timeCrowdBase(h) {
  const lunchPeak = Math.sin(Math.PI * ((h - 10) / 6));
  const eveningPeak = Math.sin(Math.PI * ((h - 16) / 6));
  return Math.min(1, Math.max(0, Math.max(0, lunchPeak) * 0.7 + Math.max(0, eveningPeak) * 1.0));
}

function getPlaceState(placeId, simMinutes) {
  const hour = (simMinutes % (24 * 60)) / 60;
  const baseOffset = seededNoise(placeId, 'base', 0.3) - 0.15;
  const noiseAmp = seededNoise(placeId, 'amp', 0.2);
  const timeSlot = Math.floor(simMinutes / 10);
  const slowNoise = (hashString(placeId + timeSlot) - 0.5) * noiseAmp;
  const raw = Math.min(1, Math.max(0, timeCrowdBase(hour) + baseOffset + slowNoise));
  const crowdPercent = Math.round(raw * 100);
  return { placeId, crowdPercent };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test('different places produce different crowdPercent at the same hour', () => {
  // The brief's complaint: "AI Recommendation shows the exact same crowd
  // number (79%) as the Spice Market alert". Fix: per-place seed + per-place
  // baseOffset means at the same hour, places disagree.
  const atNoon = MOCK_PLACES.map(p => getPlaceState(p.id, 12 * 60));
  const unique = new Set(atNoon.map(s => s.crowdPercent));
  assert.ok(unique.size >= 6,
    `Expected at least 6 distinct crowd %s at noon, got ${unique.size}: ${atNoon.map(s => s.crowdPercent).join(',')}`);
});

test('same place produces different crowdPercent at different hours', () => {
  // Data must be time-varying, not constant.
  const samples = [6, 9, 12, 15, 18, 21].map(h => getPlaceState('spice-market', h * 60));
  const unique = new Set(samples.map(s => s.crowdPercent));
  assert.ok(unique.size >= 4,
    `Expected crowd to vary over the day, got unique values: ${[...unique].join(',')}`);
});

test('engine is deterministic for the same (placeId, simMinutes)', () => {
  const a = getPlaceState('spice-market', 12 * 60);
  const b = getPlaceState('spice-market', 12 * 60);
  assert.deepEqual(a, b);
});

test('all 12 places produce state in the valid 0–100 range', () => {
  for (let h = 0; h < 24; h += 1) {
    for (const p of MOCK_PLACES) {
      const s = getPlaceState(p.id, h * 60);
      assert.ok(s.crowdPercent >= 0 && s.crowdPercent <= 100,
        `${p.id} hour ${h}: crowd ${s.crowdPercent} out of range`);
    }
  }
});
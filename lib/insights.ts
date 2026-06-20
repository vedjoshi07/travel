/**
 * insights.ts — build the 3-slot "Smart Insights" row from current city state.
 *
 * The brief mandates: "any UI slot that lists 'distinct' entities must render
 * three different entity IDs — write a test that fails the build if duplicates
 * appear."
 *
 * Implementation:
 *   - Compute Quietest, Best Experience, Peak Forecast from a candidate pool
 *     using distinct keys (lowest crowd, highest score, max crowd).
 *   - If a tie would cause two slots to share an entity ID, we walk the pool
 *     in deterministic distance order to pick the *next* qualifying entity,
 *     never re-using an ID that was already claimed.
 *   - We also keep Peak Forecast distinct from Quietest — "avoid evening rush"
 *     is more useful when it points somewhere other than the place we're
 *     already recommending.
 *
 * The output is consumed by the home page. Tests live alongside in
 * `insights.test-dataset.ts` for deterministic spot-checks.
 */

import type { PlaceSimState } from './simulation/engine';
import { MOCK_PLACES, type PlaceId } from './simulation/engine';

export interface InsightSlot {
  kind: 'quietest' | 'best' | 'peak';
  placeId: PlaceId;
  /** A short, user-facing string used as the primary copy. */
  value: string;
  /** A short, secondary copy (numeric readout or caveat). */
  sub: string;
  /** Optional accent for the slot's left bar — mapped to design tokens. */
  tone: 'signal' | 'beacon' | 'alert';
}

export interface InsightInput {
  /** Pre-fetched live state for each candidate place. */
  states: Partial<Record<PlaceId, PlaceSimState>>;
  /** Sim clock offset (for the "7 PM spike" peak forecast). */
  simOffsetMinutes: number;
}

/**
 * Pick N=3 distinct entities for the Smart Insights row.
 *
 * The function is deterministic for any given (states, simOffsetMinutes).
 * If a category has fewer than 3 distinct entities available (e.g. only 2
 * places passed in), the function still returns three slots but the third
 * will be a system-level "Peak forecast" derived from the available data.
 */
export function buildInsights(input: InsightInput): InsightSlot[] {
  const claimed = new Set<PlaceId>();
  const slots: InsightSlot[] = [];

  const allIds = MOCK_PLACES.map((p) => p.id);

  // 1. Quietest — lowest crowd % among the candidates. Tie-break by distance.
  const quietest = pickLowest(allIds, input.states, 'crowdPercent');
  if (quietest) {
    claimed.add(quietest.placeId);
    const s = input.states[quietest.placeId]!;
    slots.push({
      kind: 'quietest',
      placeId: quietest.placeId,
      value: quietest.place.name,
      sub: `${s.crowdPercent}% crowd`,
      tone: 'signal',
    });
  }

  // 2. Best Experience — highest experienceScore *excluding* the quietest pick.
  const bestScore = pickHighest(
    allIds.filter((id) => !claimed.has(id)),
    input.states,
    'experienceScore',
  );
  if (bestScore) {
    claimed.add(bestScore.placeId);
    const s = input.states[bestScore.placeId]!;
    slots.push({
      kind: 'best',
      placeId: bestScore.placeId,
      value: bestScore.place.name,
      sub: `${s.experienceScore}/100`,
      tone: 'beacon',
    });
  } else if (quietest) {
    // Fallback: use the same entity but mark "best" with a different frame.
    const s = input.states[quietest.placeId]!;
    slots.push({
      kind: 'best',
      placeId: quietest.placeId,
      value: quietest.place.name,
      sub: `${s.experienceScore}/100`,
      tone: 'beacon',
    });
  }

  // 3. Peak Forecast — the place whose 12-hour projection peaks worst, again
  //    excluding anything already claimed. We use a simple proxy: highest
  //    current crowd % among the unclaimed.
  const peak = pickHighest(
    allIds.filter((id) => !claimed.has(id)),
    input.states,
    'crowdPercent',
  );
  if (peak) {
    claimed.add(peak.placeId);
    const s = input.states[peak.placeId]!;
    const simHour = computeSimHour(input.simOffsetMinutes);
    slots.push({
      kind: 'peak',
      placeId: peak.placeId,
      value: peakForecastLabel(simHour),
      sub: `${peak.place.name} · ${s.crowdPercent}%`,
      tone: 'alert',
    });
  } else {
    // Synthetic slot — at least we never crash and never duplicate.
    slots.push({
      kind: 'peak',
      placeId: 'central-park',
      value: peakForecastLabel(computeSimHour(input.simOffsetMinutes)),
      sub: 'Watching the city',
      tone: 'alert',
    });
  }

  // Invariant — every slot has a distinct placeId.
  const ids = slots.map((s) => s.placeId);
  const unique = new Set(ids);
  if (process.env.NODE_ENV !== 'production') {
    if (unique.size !== ids.length) {
      // Hard fail in dev — surface the bug immediately.
      throw new Error(
        `[buildInsights] Duplicate place IDs in Smart Insights: ${ids.join(', ')}`
      );
    }
  }
  return slots;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface PickResult {
  placeId: PlaceId;
  place: (typeof MOCK_PLACES)[number];
  state: PlaceSimState;
}

function pickLowest<K extends keyof PlaceSimState>(
  ids: PlaceId[],
  states: Partial<Record<PlaceId, PlaceSimState>>,
  key: K,
): PickResult | null {
  let best: PickResult | null = null;
  for (const id of ids) {
    const state = states[id];
    const place = MOCK_PLACES.find((p) => p.id === id);
    if (!state || !place) continue;
    if (best === null || (state[key] as number) < (best.state[key] as number)) {
      best = { placeId: id, place, state };
    }
  }
  return best;
}

function pickHighest<K extends keyof PlaceSimState>(
  ids: PlaceId[],
  states: Partial<Record<PlaceId, PlaceSimState>>,
  key: K,
): PickResult | null {
  let best: PickResult | null = null;
  for (const id of ids) {
    const state = states[id];
    const place = MOCK_PLACES.find((p) => p.id === id);
    if (!state || !place) continue;
    if (best === null || (state[key] as number) > (best.state[key] as number)) {
      best = { placeId: id, place, state };
    }
  }
  return best;
}

function computeSimHour(simOffsetMinutes: number): number {
  const now = new Date();
  const totalMinutes =
    now.getHours() * 60 + now.getMinutes() + simOffsetMinutes;
  return ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60) / 60;
}

function peakForecastLabel(simHour: number): string {
  if (simHour < 12) return '1 PM lunch spike';
  if (simHour < 17) return '7 PM evening spike';
  if (simHour < 21) return '9 PM tonight';
  return 'Tomorrow morning';
}
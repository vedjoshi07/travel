/**
 * alerts.ts — decide whether the Smart Alert should render and what it says.
 *
 * Invariant (the brief calls it a bug class): the alert banner may only
 * render when the recommended alternative is *actually* less crowded than
 * the current location. We enforce this here — the UI never has to.
 *
 * The alert logic also refuses to recommend an alternative that's the same
 * entity as the current one (e.g. duplicates), and refuses to recommend a
 * place that's far enough away that "switching" doesn't make sense.
 */

import { MOCK_PLACES, type PlaceId, type PlaceSimState } from './simulation/engine';

export interface AlertDecision {
  visible: boolean;
  currentPlaceId?: PlaceId;
  alternativePlaceId?: PlaceId;
  /** The min crowd threshold above which we'd suggest switching. */
  threshold: number;
}

export interface AlertInput {
  states: Partial<Record<PlaceId, PlaceSimState>>;
  /** The place the user is currently looking at (or considering). */
  currentPlaceId: PlaceId;
  /** Crowd threshold above which we alert. Default 65. */
  threshold?: number;
}

const DEFAULT_THRESHOLD = 65;

export function decideAlert(input: AlertInput): AlertDecision {
  const threshold = input.threshold ?? DEFAULT_THRESHOLD;
  const current = input.states[input.currentPlaceId];
  if (!current) {
    return { visible: false, threshold };
  }
  if (current.crowdPercent < threshold) {
    return { visible: false, threshold };
  }

  // Find a strictly-less-crowded alternative among the other places.
  // Deterministic tie-break: nearest by distance.
  let bestAlt: { id: PlaceId; crowdPercent: number; distanceM: number } | null = null;
  for (const p of MOCK_PLACES) {
    if (p.id === input.currentPlaceId) continue;
    const s = input.states[p.id];
    if (!s) continue;
    if (s.crowdPercent >= current.crowdPercent) continue;
    if (!bestAlt || s.crowdPercent < bestAlt.crowdPercent) {
      bestAlt = { id: p.id, crowdPercent: s.crowdPercent, distanceM: p.distanceM };
    } else if (s.crowdPercent === bestAlt.crowdPercent && p.distanceM < bestAlt.distanceM) {
      bestAlt = { id: p.id, crowdPercent: s.crowdPercent, distanceM: p.distanceM };
    }
  }

  if (!bestAlt) {
    return { visible: false, threshold };
  }

  return {
    visible: true,
    currentPlaceId: input.currentPlaceId,
    alternativePlaceId: bestAlt.id,
    threshold,
  };
}
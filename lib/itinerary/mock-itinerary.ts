/**
 * mock-itinerary.ts — deterministic mock that returns ItineraryResponse JSON.
 * Same shape a real LLM would return. Swap this file's internals to connect a real model.
 */

import { ParsedIntent } from './parse-prompt';
import { getPlaceState, MOCK_PLACES } from '../simulation/engine';

export interface TimelineStep {
  time: string;
  title: string;
  subtitle?: string;
  description?: string;
  costInr?: number;
  placeId?: string;
  category?: string;
}

export interface ItineraryResponse {
  steps: TimelineStep[];
  totalCostInr: number;
  matchedPreferences: string[];
  alternatives?: { label: string; steps: TimelineStep[] }[];
  summary: string;
}

function formatTime(base: Date, offsetMinutes: number): string {
  const d = new Date(base.getTime() + offsetMinutes * 60_000);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const ITINERARY_TEMPLATES: Record<string, {
  places: string[];
  activities: string[];
  costs: number[];
  durations: number[];
}> = {
  peaceful: {
    places: ['lotus-cafe', 'riverside-walk', 'central-park'],
    activities: ['Morning coffee & journaling', 'Riverside stroll', 'Quiet park hour'],
    costs: [180, 0, 0],
    durations: [45, 60, 60],
  },
  romantic: {
    places: ['rooftop-lounge', 'art-district', 'riverside-walk'],
    activities: ['Rooftop sunset drinks', 'Art gallery walk', 'Evening riverside stroll'],
    costs: [800, 200, 0],
    durations: [60, 90, 60],
  },
  cultural: {
    places: ['heritage-quarter', 'art-district', 'spice-market'],
    activities: ['Heritage Quarter walking tour', 'Contemporary art exhibits', 'Local spice market'],
    costs: [150, 200, 300],
    durations: [90, 60, 45],
  },
  adventure: {
    places: ['central-park', 'riverside-walk', 'night-bazaar'],
    activities: ['Morning jog in the park', 'Riverside cycling path', 'Night bazaar exploration'],
    costs: [0, 100, 500],
    durations: [60, 60, 90],
  },
  budget: {
    places: ['central-park', 'riverside-walk', 'spice-market'],
    activities: ['Free park walk', 'Riverside trail', 'Budget street food at the market'],
    costs: [0, 0, 150],
    durations: [60, 45, 60],
  },
  default: {
    places: ['lotus-cafe', 'central-park', 'art-district'],
    activities: ['Artisan coffee stop', 'Park relaxation', 'Cultural quarter visit'],
    costs: [250, 0, 150],
    durations: [30, 60, 90],
  },
};

export function generateItinerary(intent: ParsedIntent): ItineraryResponse {
  const now = new Date();
  const clock = { realTime: now, simTimeOffsetMinutes: 0 };

  // Pick template based on first matched mood
  const templateKey = intent.mood.find((m) => m in ITINERARY_TEMPLATES) ?? 'default';
  const template = ITINERARY_TEMPLATES[templateKey];

  // Build steps
  let offsetMinutes = 0;
  const steps: TimelineStep[] = template.places.map((placeId, i) => {
    const place = MOCK_PLACES.find((p) => p.id === placeId);
    const sim = getPlaceState(placeId, clock);
    const timeStr = formatTime(now, offsetMinutes);
    offsetMinutes += template.durations[i] + 15; // 15 min travel buffer

    return {
      time: timeStr,
      title: template.activities[i],
      subtitle: `${place?.name} · Crowd: ${sim.crowdPercent}%`,
      description: `Experience score ${sim.experienceScore}/100 · Wait ~${sim.queueMinutes} min`,
      costInr: template.costs[i],
      placeId,
      category: place?.category,
    };
  });

  const totalCostInr = steps.reduce((sum, s) => sum + (s.costInr ?? 0), 0);

  // Match preferences
  const matchedPreferences: string[] = [];
  if (intent.budgetInr && totalCostInr <= intent.budgetInr) matchedPreferences.push('✓ Budget');
  if (intent.mood.includes('peaceful')) matchedPreferences.push('✓ Quiet spots');
  if (intent.mood.includes('cultural')) matchedPreferences.push('✓ Cultural');
  if (intent.mood.includes('romantic')) matchedPreferences.push('✓ Romantic');
  if (intent.durationHours && intent.durationHours <= steps.length * 1.5) matchedPreferences.push('✓ Time fits');
  if (matchedPreferences.length === 0) matchedPreferences.push('✓ Personalized');

  const summary = `A ${templateKey} ${intent.durationHours ? `${intent.durationHours}h ` : ''}itinerary${intent.budgetInr ? ` within ₹${intent.budgetInr}` : ''} — curated by NEXUS AI.`;

  return { steps, totalCostInr, matchedPreferences, summary };
}

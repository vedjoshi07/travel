/**
 * parse-prompt.ts — pure, testable keyword extraction from free-text chat input.
 * No NLP infrastructure. Simple regex + keyword lists for the MVP demo.
 */

export interface ParsedIntent {
  budgetInr: number | null;
  durationHours: number | null;
  mood: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | null;
}

const MOOD_KEYWORDS: Record<string, string[]> = {
  peaceful:  ['peaceful', 'calm', 'quiet', 'relaxing', 'chill', 'serene', 'tranquil'],
  romantic:  ['romantic', 'date', 'couples', 'intimate', 'love'],
  adventure: ['adventure', 'exciting', 'thrilling', 'explore', 'discovery'],
  quick:     ['quick', 'fast', 'short', 'brief', 'hurry'],
  social:    ['social', 'friends', 'group', 'party', 'lively', 'fun'],
  budget:    ['budget', 'cheap', 'affordable', 'economical', 'low cost'],
  luxury:    ['luxury', 'premium', 'fancy', 'upscale', 'fine dining'],
  cultural:  ['culture', 'art', 'museum', 'heritage', 'history', 'local'],
};

const TIME_KEYWORDS: Record<ParsedIntent['timeOfDay'] & string, string[]> = {
  morning:   ['morning', 'breakfast', 'brunch', 'am', 'dawn'],
  afternoon: ['afternoon', 'lunch', 'midday', 'noon', 'pm'],
  evening:   ['evening', 'sunset', 'dusk', 'dinner'],
  night:     ['night', 'late', 'midnight', 'nightlife', 'after dark'],
};

export function parsePrompt(input: string): ParsedIntent {
  const lower = input.toLowerCase();

  // Budget: ₹500, Rs500, 500 rupees, inr 500
  const budgetMatch = lower.match(/(?:₹|rs\.?\s*|inr\s*)(\d[\d,]*)/);
  const budgetInr = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ''), 10) : null;

  // Duration: "2 hours", "1.5 hrs", "30 minutes", "half an hour"
  const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)/);
  const minsMatch = lower.match(/(\d+)\s*min(?:utes?)?/);
  const halfHour = /half\s+an?\s+hour/.test(lower);
  const durationHours = hoursMatch
    ? parseFloat(hoursMatch[1])
    : minsMatch
    ? parseInt(minsMatch[1], 10) / 60
    : halfHour
    ? 0.5
    : null;

  // Mood extraction
  const mood: string[] = [];
  for (const [label, words] of Object.entries(MOOD_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) {
      mood.push(label);
    }
  }

  // Time of day
  let timeOfDay: ParsedIntent['timeOfDay'] = null;
  for (const [label, words] of Object.entries(TIME_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) {
      timeOfDay = label as ParsedIntent['timeOfDay'];
      break;
    }
  }

  return { budgetInr, durationHours, mood, timeOfDay };
}

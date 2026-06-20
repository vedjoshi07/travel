import { GoogleGenAI } from '@google/genai';
import { MOCK_PLACES, getPlaceState } from '../simulation/engine';
import type { ItineraryResponse, TimelineStep } from './mock-itinerary';

const PLACES_JSON = MOCK_PLACES.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  distanceM: p.distanceM,
})).map(({ id, name, category }) => `"${id}": "${name} (${category})"`).join(', ');

const SYSTEM_PROMPT = `You are NEXUS AI, a travel planning assistant for a city exploration app.

Available places: {${PLACES_JSON}}.

Given the user's request, generate a personalized itinerary as JSON in this exact format:
{
  "steps": [
    {
      "time": "HH:MM",
      "title": "Activity name",
      "subtitle": "Place name with context (e.g. crowd level if relevant)",
      "description": "Brief 1-line description",
      "costInr": 0-9999,
      "placeId": "one of the place IDs above",
      "category": "Category label"
    }
  ],
  "totalCostInr": 0-9999,
  "matchedPreferences": ["✓ Personalized"],
  "summary": "Short 1-sentence summary of the itinerary"
}

Rules:
- Output ONLY valid JSON, no markdown, no code fences, no extra text.
- Use realistic Indian rupee costs (₹).
- Each step should be 30-120 minutes long.
- Include 2-4 steps in the itinerary.
- Start times should be sequential and reasonable.
- Pick placeIds only from the available places list above.
- The summary should be conversational and helpful (1 sentence).`;

export async function generateItineraryWithGemini(
  userInput: string,
): Promise<ItineraryResponse> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
  }

  const clock = { realTime: new Date(), simTimeOffsetMinutes: 0 };
  const liveContext = MOCK_PLACES.map((p) => {
    const s = getPlaceState(p.id, clock);
    return `${p.name}: crowd ${s.crowdPercent}%, experience ${s.experienceScore}/100, noise ${s.noiseLevel}, queue ~${s.queueMinutes}min`;
  }).join('\n');

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `User request: ${userInput}\n\nCurrent live conditions:\n${liveContext}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  const clean = text.replace(/```(?:json)?\s*/g, '').trim();
  const parsed: ItineraryResponse = JSON.parse(clean);

  if (!parsed.steps || !Array.isArray(parsed.steps)) {
    throw new Error('Invalid itinerary format from Gemini');
  }

  return {
    steps: parsed.steps,
    totalCostInr: parsed.totalCostInr ?? parsed.steps.reduce((s: number, step: TimelineStep) => s + (step.costInr ?? 0), 0),
    matchedPreferences: parsed.matchedPreferences ?? ['✓ AI-generated'],
    summary: parsed.summary ?? `Here's your personalized itinerary!`,
  };
}

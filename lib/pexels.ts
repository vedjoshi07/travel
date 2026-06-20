const PEXELS_API_KEY = 'SK0CN8f7zUUXBKT9C7fcZVrCRSbPKMrOErMpwbSpaS5CqVsTeKMIqF7N';
const BASE_URL = 'https://api.pexels.com/v1';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
    portrait: string;
    landscape: string;
  };
}

export interface PexelsSearchResult {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

export async function searchPhotos(
  query: string,
  perPage = 15,
  page = 1,
  orientation?: 'landscape' | 'portrait' | 'square',
): Promise<PexelsSearchResult> {
  const params = new URLSearchParams({ query, per_page: String(perPage), page: String(page) });
  if (orientation) params.set('orientation', orientation);

  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { Authorization: PEXELS_API_KEY },
  });

  if (!res.ok) {
    throw new Error(`Pexels search failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getCuratedPhotos(
  perPage = 15,
  page = 1,
): Promise<PexelsSearchResult> {
  const params = new URLSearchParams({ per_page: String(perPage), page: String(page) });

  const res = await fetch(`${BASE_URL}/curated?${params}`, {
    headers: { Authorization: PEXELS_API_KEY },
  });

  if (!res.ok) {
    throw new Error(`Pexels curated failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

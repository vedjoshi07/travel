import { MOCK_PLACES } from '@/lib/simulation/engine';
import ForecastClientPage from './forecast-client';

export function generateStaticParams() {
  return MOCK_PLACES.map((place) => ({
    id: place.id,
  }));
}

export default async function ForecastPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ForecastClientPage id={resolvedParams.id} />;
}

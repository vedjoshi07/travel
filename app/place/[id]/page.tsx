import { MOCK_PLACES } from '@/lib/simulation/engine';
import PlaceClientPage from './place-client';

export function generateStaticParams() {
  return MOCK_PLACES.map((place) => ({
    id: place.id,
  }));
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <PlaceClientPage id={resolvedParams.id} />;
}

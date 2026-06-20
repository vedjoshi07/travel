'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getCityState } from '../simulation/engine';
import { useSimClock } from '../simulation/sim-clock-context';

const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

export function useCityState(coords = DEFAULT_COORDS) {
  const { simOffsetMinutes } = useSimClock();
  const qc = useQueryClient();

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['city'] });
  }, [simOffsetMinutes, qc]);

  return useQuery({
    queryKey: ['city', coords.lat, coords.lng, simOffsetMinutes],
    queryFn: () =>
      getCityState(coords, { realTime: new Date(), simTimeOffsetMinutes: simOffsetMinutes }),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

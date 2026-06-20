'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getPlaceState } from '../simulation/engine';
import { useSimClock } from '../simulation/sim-clock-context';

export function usePlaceState(placeId: string) {
  const { simOffsetMinutes } = useSimClock();
  const qc = useQueryClient();

  // Invalidate when sim time changes
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['place', placeId] });
  }, [simOffsetMinutes, placeId, qc]);

  return useQuery({
    queryKey: ['place', placeId, simOffsetMinutes],
    queryFn: () =>
      getPlaceState(placeId, { realTime: new Date(), simTimeOffsetMinutes: simOffsetMinutes }),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

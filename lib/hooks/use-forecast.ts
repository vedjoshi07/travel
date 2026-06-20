'use client';
import { useQuery } from '@tanstack/react-query';
import { getForecast } from '../simulation/engine';
import { useSimClock } from '../simulation/sim-clock-context';

export function useForecast(placeId: string, hoursAhead = 12) {
  const { simOffsetMinutes } = useSimClock();
  return useQuery({
    queryKey: ['forecast', placeId, hoursAhead, simOffsetMinutes],
    queryFn: () =>
      getForecast(placeId, hoursAhead, { realTime: new Date(), simTimeOffsetMinutes: simOffsetMinutes }),
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

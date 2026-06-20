/**
 * Simulation Engine — enhanced with SimClock context
 * Exposes a React context so any component can advance simulated time for demos.
 */
'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SimClockContextValue {
  simOffsetMinutes: number;
  setSimOffset: (minutes: number) => void;
  advanceBy: (minutes: number) => void;
  reset: () => void;
}

const SimClockContext = createContext<SimClockContextValue>({
  simOffsetMinutes: 0,
  setSimOffset: () => {},
  advanceBy: () => {},
  reset: () => {},
});

export function SimClockProvider({ children }: { children: ReactNode }) {
  const [simOffsetMinutes, setSimOffset] = useState(0);

  const advanceBy = useCallback((minutes: number) => {
    setSimOffset((prev) => prev + minutes);
  }, []);

  const reset = useCallback(() => setSimOffset(0), []);

  return (
    <SimClockContext.Provider value={{ simOffsetMinutes, setSimOffset, advanceBy, reset }}>
      {children}
    </SimClockContext.Provider>
  );
}

export function useSimClock() {
  return useContext(SimClockContext);
}

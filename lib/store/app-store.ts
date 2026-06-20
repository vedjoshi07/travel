import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LayerId = 'crowd' | 'traffic' | 'weather' | 'events' | 'safety' | 'price' | 'air' | 'photo';

interface AppStore {
  theme: 'dark' | 'light';
  activeMapLayers: Set<LayerId>;
  userPreferences: {
    budgetRange: [number, number];
    mood: string[];
    walkingComfort: 'low' | 'med' | 'high';
  };
  alertDismissed: boolean;

  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toggleLayer: (l: LayerId) => void;
  setLayerActive: (l: LayerId, active: boolean) => void;
  setUserPreferences: (prefs: Partial<AppStore['userPreferences']>) => void;
  dismissAlert: () => void;
  resetAlert: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeMapLayers: new Set<LayerId>(['crowd', 'traffic', 'weather', 'events']),
      userPreferences: {
        budgetRange: [200, 2000],
        mood: ['peaceful'],
        walkingComfort: 'med',
      },
      alertDismissed: false,

      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', t);
        }
      },

      toggleTheme: () => {
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', next);
          }
          return { theme: next };
        });
      },

      toggleLayer: (l) =>
        set((state) => {
          const next = new Set(state.activeMapLayers);
          if (next.has(l)) next.delete(l);
          else next.add(l);
          return { activeMapLayers: next };
        }),

      setLayerActive: (l, active) =>
        set((state) => {
          const next = new Set(state.activeMapLayers);
          if (active) next.add(l);
          else next.delete(l);
          return { activeMapLayers: next };
        }),

      setUserPreferences: (prefs) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...prefs },
        })),

      dismissAlert: () => set({ alertDismissed: true }),
      resetAlert: () => set({ alertDismissed: false }),
    }),
    {
      name: 'nexus-store',
      partialize: (state) => ({
        theme: state.theme,
        userPreferences: state.userPreferences,
      }),
    }
  )
);

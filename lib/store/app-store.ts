import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocaleSettings } from '@/lib/locale';
import { DEFAULT_LOCALE } from '@/lib/locale';

export type LayerId = 'crowd' | 'traffic' | 'weather' | 'events' | 'safety' | 'price' | 'air' | 'photo';

interface AppStore {
  theme: 'dark' | 'light';
  activeMapLayers: Set<LayerId>;
  userPreferences: {
    budgetRange: [number, number];
    mood: string[];
    walkingComfort: 'low' | 'med' | 'high';
  };
  locale: LocaleSettings;
  /** "Watchlist" — places the user has opted to receive crowd alerts for. */
  watchedPlaces: string[];
  /** Trending / share state — counts how many unique timeslots a place was
   *  viewed. Used for the "X people checked this live" social-proof line. */
  explorerScore: number;
  alertDismissed: boolean;

  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toggleLayer: (l: LayerId) => void;
  setLayerActive: (l: LayerId, active: boolean) => void;
  setUserPreferences: (prefs: Partial<AppStore['userPreferences']>) => void;
  setLocale: (locale: Partial<LocaleSettings>) => void;
  watchPlace: (placeId: string) => void;
  unwatchPlace: (placeId: string) => void;
  incrementExplorerScore: () => void;
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
      locale: DEFAULT_LOCALE,
      watchedPlaces: [],
      explorerScore: 0,
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

      setLocale: (locale) =>
        set((state) => ({ locale: { ...state.locale, ...locale } })),

      watchPlace: (placeId) =>
        set((state) => ({
          watchedPlaces: state.watchedPlaces.includes(placeId)
            ? state.watchedPlaces
            : [...state.watchedPlaces, placeId],
        })),

      unwatchPlace: (placeId) =>
        set((state) => ({
          watchedPlaces: state.watchedPlaces.filter((id) => id !== placeId),
        })),

      incrementExplorerScore: () =>
        set((state) => ({ explorerScore: state.explorerScore + 1 })),

      dismissAlert: () => set({ alertDismissed: true }),
      resetAlert: () => set({ alertDismissed: false }),
    }),
    {
      name: 'nexus-store',
      partialize: (state) => ({
        theme: state.theme,
        userPreferences: state.userPreferences,
        locale: state.locale,
        watchedPlaces: state.watchedPlaces,
        explorerScore: state.explorerScore,
      }),
    }
  )
);
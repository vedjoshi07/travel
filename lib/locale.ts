/**
 * locale.ts — locale-aware formatting for currency, distance, and time.
 *
 * Defaults to en-IN / ₹ because the place catalogue is currently Indian, but
 * everything is configurable. The settings live in Zustand so they persist
 * and can be changed from Profile.
 *
 * All UI that displays a currency symbol, distance, or wall-clock time MUST
 * go through one of these helpers instead of hardcoding "₹" / "km" / "en-IN".
 */

export type LocaleCode = 'en-IN' | 'en-US' | 'en-GB' | 'hi-IN';
export type DistanceUnit = 'km' | 'mi';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface LocaleSettings {
  locale: LocaleCode;
  currency: CurrencyCode;
  distanceUnit: DistanceUnit;
  hour12: boolean;
}

export const DEFAULT_LOCALE: LocaleSettings = {
  locale: 'en-IN',
  currency: 'INR',
  distanceUnit: 'km',
  hour12: true,
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/** Convert meters to the user's preferred distance unit, formatted. */
export function formatDistance(meters: number, settings: LocaleSettings = DEFAULT_LOCALE): string {
  if (!Number.isFinite(meters)) return '—';
  if (settings.distanceUnit === 'mi') {
    const miles = meters / 1609.344;
    return miles >= 1
      ? `${miles.toFixed(miles >= 10 ? 0 : 1)} mi`
      : `${Math.round(meters * 3.28084)} ft`;
  }
  return meters >= 1000
    ? `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`
    : `${Math.round(meters)} m`;
}

/** Format an amount in the active currency, locale-aware. */
export function formatCurrency(amount: number, settings: LocaleSettings = DEFAULT_LOCALE): string {
  const symbol = CURRENCY_SYMBOLS[settings.currency];
  // toLocaleString with the matching currency gives us grouping + decimals.
  try {
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency: settings.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${symbol}${Math.round(amount).toLocaleString(settings.locale)}`;
  }
}

/** Format a Date or timestamp according to active locale + 12/24h preference. */
export function formatTime(
  date: Date,
  settings: LocaleSettings = DEFAULT_LOCALE,
  options: { seconds?: boolean } = {},
): string {
  return new Intl.DateTimeFormat(settings.locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: options.seconds ? '2-digit' : undefined,
    hour12: settings.hour12,
  }).format(date);
}

/** Format an hour slot label, e.g. "07:00" or "7 AM". */
export function formatHourSlot(
  date: Date,
  settings: LocaleSettings = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(settings.locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.hour12,
  }).format(date);
}
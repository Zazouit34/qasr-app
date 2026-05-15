export const LOCALES = ["fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "qasr_locale";

export function isLocale(v: string | undefined): v is Locale {
  return v === "fr" || v === "ar";
}

export function parseLocaleCookie(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { DEFAULT_LOCALE, LOCALE_COOKIE } from "@/i18n/config";
import { getNested } from "@/i18n/utils";
import frMessages from "@/messages/fr.json";
import arMessages from "@/messages/ar.json";

const dictionaries: Record<Locale, Record<string, unknown>> = {
  fr: frMessages as Record<string, unknown>,
  ar: arMessages as Record<string, unknown>,
};

type TFunction = (key: string, vars?: Record<string, string | number>) => string;

type I18nCtx = {
  locale: Locale;
  t: TFunction;
  setLocale: (loc: Locale) => void;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dict = dictionaries[locale];

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = getNested(dict, key) ?? key;
      if (vars) {
        for (const [vk, val] of Object.entries(vars)) {
          s = s.replaceAll(`{{${vk}}}`, String(val));
        }
      }
      return s;
    },
    [dict]
  );

  const setLocale = useCallback(
    (loc: Locale) => {
      if (loc === locale) return;
      document.cookie = `${LOCALE_COOKIE}=${loc};path=/;max-age=31536000;SameSite=Lax`;
      router.refresh();
    },
    [locale, router]
  );

  const value = useMemo<I18nCtx>(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const fallbackT: TFunction = (key) => key;
    return {
      locale: DEFAULT_LOCALE,
      t: fallbackT,
      setLocale: () => {},
    };
  }
  return ctx;
}

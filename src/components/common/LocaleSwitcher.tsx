"use client";

import { useI18n } from "@/context/I18nContext";
import type { Locale } from "@/i18n/config";

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  function select(loc: Locale) {
    setLocale(loc);
  }

  return (
    <div
      className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-800 dark:bg-white/[0.04]"
      role="group"
      aria-label={t("common.languageSwitcher")}
    >
      <button
        type="button"
        onClick={() => select("fr")}
        className={`rounded-md px-2.5 py-1 text-theme-xs font-medium transition-colors ${
          locale === "fr"
            ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-800 dark:text-brand-400"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => select("ar")}
        className={`rounded-md px-2.5 py-1 text-theme-xs font-medium transition-colors ${
          locale === "ar"
            ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-800 dark:text-brand-400"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        العربية
      </button>
    </div>
  );
}

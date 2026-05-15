"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Ticket, Users, Receipt } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

type Hit = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchCommandPalette({ open, onClose }: Props) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<{ clients: Hit[]; events: Hit[]; payments: Hit[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setHits(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        credentials: "include",
      });
      const j = await res.json();
      if (j.success) setHits(j.data);
      else setHits({ clients: [], events: [], payments: [] });
    } catch {
      setHits({ clients: [], events: [], payments: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const tmo = window.setTimeout(() => void runSearch(q), 220);
    return () => window.clearTimeout(tmo);
  }, [q, open, runSearch]);

  useEffect(() => {
    if (open) {
      setQ("");
      setHits(null);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sections: { label: string; icon: typeof Users; items: Hit[] }[] = [
    { label: t("search.sectionClients"), icon: Users, items: hits?.clients ?? [] },
    { label: t("search.sectionEvents"), icon: Ticket, items: hits?.events ?? [] },
    { label: t("search.sectionPayments"), icon: Receipt, items: hits?.payments ?? [] },
  ];

  return (
    <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm dark:bg-black/50"
        aria-label={t("search.closeAria")}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholderModal")}
            className="flex-1 border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 sm:inline-block dark:border-gray-700 dark:bg-white/10 dark:text-gray-400">
            esc
          </kbd>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto px-2 py-2">
          {q.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
              {t("search.hintMinChars")}
            </p>
          ) : loading && !hits ? (
            <p className="px-3 py-8 text-center text-theme-sm text-gray-500">{t("search.loading")}</p>
          ) : (
            sections.map(({ label, icon: Icon, items }) =>
              items.length ? (
                <div key={label} className="mb-4">
                  <p className="flex items-center gap-2 px-3 py-1.5 text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </p>
                  <ul>
                    {items.map((hit) => (
                      <li key={`${hit.type}-${hit.id}`}>
                        <Link
                          href={hit.href}
                          onClick={onClose}
                          className="flex flex-col rounded-lg px-3 py-2 text-start hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{hit.title}</span>
                          <span className="text-theme-xs text-gray-500 dark:text-gray-400">{hit.subtitle}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )
          )}
          {hits &&
          !hits.clients.length &&
          !hits.events.length &&
          !hits.payments.length &&
          q.trim().length >= 2 &&
          !loading ? (
            <p className="px-3 py-6 text-center text-theme-sm text-gray-500">{t("search.empty")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

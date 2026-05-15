"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { BasicTableSurface } from "@/components/tables/BasicTableOne";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/context/I18nContext";
import { formatDZD } from "@/lib/utils";
import type { Event } from "@prisma/client";

type Row = Event & {
  client: { firstName: string; lastName: string; phone?: string };
  hall: { name: string } | null;
  paid: number;
  balance: number;
};

const PAGE_SIZE = 10;
const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

const STATUS_OPTIONS = ["ALL", "CONFIRMED", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "INQUIRY"] as const;

export default function EventsListPage() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");

  useEffect(() => {
    const tmo = window.setTimeout(() => setDebouncedSearch(searchDraft.trim()), 320);
    return () => window.clearTimeout(tmo);
  }, [searchDraft]);

  const loadEvents = useCallback(async () => {
    const qs = new URLSearchParams({ limit: "200" });
    if (debouncedSearch) qs.set("search", debouncedSearch);
    if (status !== "ALL") qs.set("status", status);
    const r = await fetch(`/api/events?${qs}`, { credentials: "include" });
    const j = await r.json();
    if (j.success && j.data?.items) setItems(j.data.items);
    else setItems([]);
  }, [debouncedSearch, status]);

  useEffect(() => {
    setPage(1);
    void loadEvents();
  }, [loadEvents]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  const df = locale === "ar" ? "ar-DZ" : "fr-FR";

  return (
    <>
      <PageBreadCrumb titleKey="titles.events" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Liste des événements</h1>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Planning des réservations et accès aux fiches.
            </p>
          </div>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Nouvel événement
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="block min-w-[200px] flex-1">
            <span className="mb-1 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Recherche client / téléphone / titre / n°
            </span>
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="0550… Jasmin EVT-…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
            />
          </label>
          <label className="block w-full sm:w-48">
            <span className="mb-1 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">Statut</span>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "Tous" : t(`eventStatus.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ComponentCard title="Résumé">
          <BasicTableSurface>
            <div className="min-w-[720px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      N°
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Client
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Date
                    </TableCell>
                    <TableCell isHeader className={`${th} text-end`}>
                      Total
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Statut
                    </TableCell>
                    <TableCell isHeader className={`${th} w-24`}>
                      &nbsp;
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageSlice.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Aucun événement.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageSlice.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">{e.eventNumber}</TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                          <Link href={`/clients/${e.clientId}`} className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                            {e.client.firstName} {e.client.lastName}
                          </Link>
                          {e.client.phone ? (
                            <span className="mt-0.5 block text-theme-xs text-gray-500">{e.client.phone}</span>
                          ) : null}
                          {e.hall?.name ? (
                            <span className="mt-0.5 block text-theme-xs text-gray-500">{e.hall.name}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                          {new Date(e.eventDate).toLocaleDateString(df)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                          {formatDZD(e.totalPrice)}
                        </TableCell>
                        <TableCell className="px-5 py-4 sm:px-6">
                          <Badge size="sm" color="primary" variant="light">
                            {t(`eventStatus.${e.status}`) || e.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end sm:px-6">
                          <Link href={`/events/${e.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                            Voir
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </BasicTableSurface>

          {items.length > PAGE_SIZE ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Page {currentPage} sur {totalPages}
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </ComponentCard>
      </div>
    </>
  );
}

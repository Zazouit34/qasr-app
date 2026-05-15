"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Banknote } from "lucide-react";
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
import { paymentStatusBadgeColor } from "@/lib/payment-status-ui";
import { formatDZD } from "@/lib/utils";

const PAGE_SIZE = 12;
const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

type PaymentItem = {
  id: string;
  paymentNumber: string;
  amount: number;
  status: string;
  dueDate: string | null;
  eventId: string;
  event: { title: string; client: { firstName: string; lastName: string } };
};

type FilterTab = "all" | "pending" | "paid" | "overdue" | "cancelled";

function pillLabel(tab: FilterTab, t: (key: string) => string): string {
  switch (tab) {
    case "all":
      return t("payments.filterAll");
    case "pending":
      return t("payments.filterPending");
    case "overdue":
      return t("payments.filterOverdue");
    case "paid":
      return t("payments.filterPaid");
    case "cancelled":
      return t("payments.filterCancelled");
    default:
      return tab;
  }
}

export default function PaymentsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<FilterTab>("all");
  const [payload, setPayload] = useState<{
    items: PaymentItem[];
    overview: { overdueAmount: number };
  } | null>(null);
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    const qs = new URLSearchParams();
    if (tab === "pending") {
      qs.set("status", "PENDING");
    } else if (tab === "paid") {
      qs.set("status", "PAID");
    } else if (tab === "overdue") {
      qs.set("tab", "overdue");
    } else if (tab === "cancelled") {
      qs.set("status", "CANCELLED");
    }
    const url = qs.toString() ? `/api/payments?${qs.toString()}` : "/api/payments";
    const r = await fetch(url, { credentials: "include" });
    const j = await r.json();
    if (j.success && j.data) setPayload(j.data);
    else setPayload(null);
  }, [tab]);

  useEffect(() => {
    setPage(1);
    void fetchPayments();
  }, [fetchPayments]);

  const items = useMemo(() => payload?.items ?? [], [payload]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  const filterPills: { id: FilterTab }[] = [
    { id: "all" },
    { id: "pending" },
    { id: "overdue" },
    { id: "paid" },
    { id: "cancelled" },
  ];

  return (
    <>
      <PageBreadCrumb titleKey="payments.title" />
      <div className="space-y-6">
        {payload && payload.overview.overdueAmount > 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-theme-sm dark:border-orange-900/60 dark:bg-orange-500/10">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-100">{t("payments.alertOverdueTitle")}</p>
              <p className="mt-1 text-orange-700/90 dark:text-orange-200/90">
                {t("payments.alertOverdueBody", { amount: formatDZD(payload.overview.overdueAmount) })}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {filterPills.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setTab(p.id)}
              className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors ${
                tab === p.id
                  ? "bg-brand-500 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
              }`}
            >
              {pillLabel(p.id, t)}
            </button>
          ))}
        </div>

        <ComponentCard
          title={
            <span className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-brand-500" aria-hidden />
              {t("payments.cardTitle")}
            </span>
          }
          desc={t("payments.cardDesc")}
        >
          <BasicTableSurface>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className={th}>
                    {t("payments.colNum")}
                  </TableCell>
                  <TableCell isHeader className={th}>
                    {t("payments.colEvent")}
                  </TableCell>
                  <TableCell isHeader className={`${th} text-end`}>
                    {t("payments.colAmount")}
                  </TableCell>
                  <TableCell isHeader className={th}>
                    {t("payments.colStatus")}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pageSlice.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                    >
                      {t("payments.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageSlice.map((pymt) => (
                    <TableRow key={pymt.id}>
                      <TableCell className="px-5 py-4 font-medium text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                        <Link href={`/events/${pymt.eventId}?tab=payments`} className="text-brand-600 hover:text-brand-500 dark:text-brand-400">
                          {pymt.paymentNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm sm:px-6">
                        <Link
                          href={`/events/${pymt.eventId}`}
                          className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                        >
                          {pymt.event.title}
                        </Link>
                        <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                          {pymt.event.client.firstName} {pymt.event.client.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-end text-theme-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                        <Link href={`/events/${pymt.eventId}?tab=payments`} className="hover:text-brand-600 dark:hover:text-brand-400">
                          {formatDZD(pymt.amount)}
                        </Link>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6">
                        <Badge variant="light" color={paymentStatusBadgeColor(pymt.status)} size="sm">
                          {t(`payments.status.${pymt.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </BasicTableSurface>

          {items.length > PAGE_SIZE ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {t("common.page")} {currentPage} {t("common.of")} {totalPages}
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </ComponentCard>
      </div>
    </>
  );
}

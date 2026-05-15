"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AlertCircle, Banknote, CalendarRange, Trophy } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import DashboardCharts, { type MonthlyRevenuePoint } from "@/components/qasr/DashboardCharts";
import { formatDZD } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";

type Stats = {
  eventsThisMonth: number;
  revenueThisMonth: number;
  pendingPaymentsTotal: number;
  upcomingThisWeek: number;
  upcomingEvents: {
    id: string;
    title: string;
    clientName: string;
    eventDate: string;
    guestCount: number;
    hallName: string | null;
  }[];
  pendingPayments: {
    id: string;
    amount: number;
    paymentNumber: string;
    eventTitle: string;
    eventId: string;
    clientName: string;
    dueDate: string | null;
  }[];
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    user: { name: string | null };
  }[];
  monthlyRevenue: MonthlyRevenuePoint[];
  statusBreakdown: Record<string, number>;
};

type OnboardingBanner = {
  percentComplete: number;
  isFinished: boolean;
};

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingBanner | null>(null);

  useEffect(() => {
    void fetch("/api/dashboard/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setStats(j.data);
      });
    void fetch("/api/venue/onboarding", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setOnboarding({
            percentComplete: j.data.percentComplete as number,
            isFinished: !!j.data.isFinished,
          });
        }
      });
  }, []);

  const dfLocale = locale === "ar" ? "ar-DZ" : "fr-FR";

  return (
    <>
      <PageBreadCrumb titleKey="dashboard.title" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {onboarding && onboarding.percentComplete < 100 && !onboarding.isFinished ? (
          <div className="col-span-12 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-900/60 dark:bg-brand-500/10">
            <p className="text-sm font-medium text-brand-900 dark:text-brand-100">
              Complétez la configuration du lieu ({onboarding.percentComplete}%)
            </p>
            <p className="mt-1 text-theme-sm text-brand-900/80 dark:text-brand-100/90">
              Salles, catalogue et documents seront bien remplis pour vos devis et contrats.
            </p>
            <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-white dark:bg-brand-950/40">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width]"
                style={{ width: `${Math.min(100, onboarding.percentComplete)}%` }}
              />
            </div>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-700"
            >
              Reprendre l’assistant
            </Link>
          </div>
        ) : null}

        <div className="col-span-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            icon={CalendarRange}
            title={t("dashboard.kpiEventsMonth")}
            value={stats?.eventsThisMonth ?? "—"}
          />
          <Kpi
            icon={Banknote}
            title={t("dashboard.kpiRevenueMonth")}
            value={stats ? formatDZD(stats.revenueThisMonth) : "—"}
          />
          <Kpi
            icon={AlertCircle}
            title={t("dashboard.kpiPendingPayments")}
            value={stats ? formatDZD(stats.pendingPaymentsTotal) : "—"}
            warn={(stats?.pendingPaymentsTotal ?? 0) > 0}
          />
          <Kpi
            icon={Trophy}
            title={t("dashboard.kpiEventsWeek")}
            value={stats?.upcomingThisWeek ?? "—"}
          />
        </div>

        <div className="col-span-12 flex flex-wrap justify-end gap-3">
          <Link
            href="/events/new"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            {t("dashboard.ctaNewBooking")}
          </Link>
          <Link
            href="/payments"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {t("dashboard.ctaRecordPayment")}
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-brand-600 hover:underline"
          >
            {t("dashboard.ctaCalendar")}
          </Link>
        </div>

        {stats ? (
          <DashboardCharts
            monthlyRevenue={stats.monthlyRevenue ?? []}
            statusBreakdown={stats.statusBreakdown ?? {}}
          />
        ) : (
          <div className="col-span-12 h-48 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        )}

        <div className="col-span-12 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">{t("dashboard.upcoming")}</h3>
            <ul className="space-y-3">
              {stats?.upcomingEvents?.length ? (
                stats.upcomingEvents.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/events/${e.id}`}
                      className="block rounded-xl border border-gray-100 p-4 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{e.title}</span>
                      <span className="mt-1 block text-theme-xs text-gray-500">
                        {e.clientName} · {new Date(e.eventDate).toLocaleDateString(dfLocale)} · {e.guestCount}{" "}
                        {t("common.guestsShort")}
                        {e.hallName ? ` · ${e.hallName}` : ""}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.noUpcoming")}</li>
              )}
            </ul>
          </section>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">{t("dashboard.pendingPayments")}</h3>
            <ul className="space-y-3">
              {stats?.pendingPayments?.length ? (
                stats.pendingPayments.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/events/${p.eventId}?tab=payments`}
                      className="block rounded-xl border border-gray-100 p-4 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{p.eventTitle}</span>
                      <span className="mt-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                        {p.clientName} · {formatDZD(p.amount)}
                        {p.dueDate
                          ? ` · ${t("dashboard.dueShort")}: ${new Date(p.dueDate).toLocaleDateString(dfLocale)}`
                          : ""}
                      </span>
                      <span className="mt-1 block text-theme-xs text-gray-400">{p.paymentNumber}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.noPending")}</li>
              )}
            </ul>
          </section>
        </div>

        <section className="col-span-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">{t("dashboard.activity")}</h3>
          <ul className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {stats?.recentActivity?.length ? (
              stats.recentActivity.map((a) => (
                <li key={a.id} className="rounded-xl border border-gray-100 p-4 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{a.user.name}</span>{" "}
                  — {a.action}{" "}
                  <span className="text-theme-xs opacity-80">({a.entity})</span>
                </li>
              ))
            ) : (
              <li className="col-span-full text-gray-500 dark:text-gray-400">{t("dashboard.noActivity")}</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

function Kpi({
  icon: Icon,
  title,
  value,
  warn,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 dark:border-gray-800 ${
        warn ? "border-orange-200 bg-orange-50 dark:bg-orange-500/10" : "border-gray-200 bg-white dark:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            warn ? "bg-white text-orange-600 dark:bg-orange-950/40 dark:text-orange-300" : "bg-gray-50 text-brand-500 dark:bg-white/[0.05]"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

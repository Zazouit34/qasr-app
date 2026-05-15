"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { format } from "date-fns";
import { ar as dfAr, fr as dfFr } from "date-fns/locale";
import ComponentCard from "@/components/common/ComponentCard";
import { useI18n } from "@/context/I18nContext";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type MonthlyRevenuePoint = { month: number; year: number; total: number };

type Props = {
  monthlyRevenue: MonthlyRevenuePoint[];
  statusBreakdown: Record<string, number>;
};

export default function DashboardCharts({ monthlyRevenue, statusBreakdown }: Props) {
  const { locale, t } = useI18n();
  const dfLocale = locale === "ar" ? dfAr : dfFr;

  const barCategories = useMemo(
    () =>
      monthlyRevenue.map((row) =>
        format(new Date(row.year, row.month - 1, 1), "MMM", { locale: dfLocale })
      ),
    [monthlyRevenue, dfLocale]
  );

  const barSeries = useMemo(
    () => [{ name: t("dashboard.kpiRevenueMonth"), data: monthlyRevenue.map((m) => m.total) }],
    [monthlyRevenue, t]
  );

  const barOptions: ApexOptions = useMemo(
    () => ({
      colors: ["#465fff"],
      chart: {
        fontFamily: "inherit",
        type: "bar",
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "48%",
          borderRadius: 6,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 4,
        colors: ["transparent"],
      },
      xaxis: {
        categories: barCategories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -45,
          rotateAlways: monthlyRevenue.length > 8,
          style: { fontSize: "11px" },
        },
      },
      grid: {
        yaxis: { lines: { show: true } },
      },
      yaxis: {
        labels: {
          formatter: (val: number) =>
            locale === "ar"
              ? new Intl.NumberFormat("ar-DZ", { notation: "compact", maximumFractionDigits: 1 }).format(
                  val
                )
              : new Intl.NumberFormat("fr-DZ", { notation: "compact", maximumFractionDigits: 1 }).format(
                  val
                ),
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) =>
            new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ").format(val) + " DA",
        },
      },
      legend: { show: false },
      fill: { opacity: 1 },
    }),
    [barCategories, locale, monthlyRevenue.length]
  );

  const pieEntries = useMemo(
    () => Object.entries(statusBreakdown).filter(([, v]) => v > 0),
    [statusBreakdown]
  );

  const pieLabels = useMemo(
    () => pieEntries.map(([k]) => t(`eventStatus.${k}`) || k),
    [pieEntries, t]
  );

  const pieSeries = useMemo(() => pieEntries.map(([, v]) => v), [pieEntries]);

  const statusBarHeight = Math.max(300, Math.min(560, pieEntries.length * 40 + 120));

  const statusBarSeries = useMemo(
    () => [{ name: t("dashboard.chartEventsTitle"), data: pieSeries }],
    [pieSeries, t]
  );

  const statusBarOptions: ApexOptions = useMemo(
    () => ({
      colors: ["#465fff"],
      chart: {
        fontFamily: "inherit",
        type: "bar",
        height: statusBarHeight,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "74%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: {
        enabled: true,
        offsetX: 8,
        style: { fontSize: "11px", colors: ["#475467"], fontWeight: 500 },
        formatter: (val: number) => String(Math.round(Number(val))),
      },
      stroke: { show: true, width: 0 },
      grid: {
        xaxis: { lines: { show: true } },
        padding: { top: 0, right: 28, bottom: 0, left: 16 },
      },
      xaxis: {
        categories: pieLabels,
      },
      yaxis: {
        labels: {
          style: { fontSize: "11px" },
          maxWidth: 220,
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => String(val),
        },
      },
      legend: { show: false },
    }),
    [pieLabels, statusBarHeight]
  );

  const hasRevenue = monthlyRevenue.some((m) => m.total > 0);
  const hasStatus = pieSeries.length > 0;

  return (
    <div className="col-span-12 grid gap-6 xl:grid-cols-2">
      <ComponentCard title={t("dashboard.chartRevenueTitle")} desc={t("dashboard.chartRevenueSubtitle")}>
        {hasRevenue ? (
          <div className="-mx-2 min-h-[300px]">
            <ReactApexChart options={barOptions} series={barSeries} type="bar" height={300} />
          </div>
        ) : (
          <p className="py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            {t("dashboard.emptyChart")}
          </p>
        )}
      </ComponentCard>
      <ComponentCard title={t("dashboard.chartEventsTitle")} desc={t("dashboard.chartEventsSubtitle")}>
        {hasStatus ? (
          <div className="-mx-2 min-h-[300px]">
            <ReactApexChart options={statusBarOptions} series={statusBarSeries} type="bar" height={statusBarHeight} />
          </div>
        ) : (
          <p className="py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            {t("dashboard.emptyChart")}
          </p>
        )}
      </ComponentCard>
    </div>
  );
}

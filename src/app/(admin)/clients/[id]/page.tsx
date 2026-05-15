"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CreditCard, Wallet } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { BasicTableSurface } from "@/components/tables/BasicTableOne";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDZD } from "@/lib/utils";

const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetch(`/api/clients/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, [id]);

  if (!data) {
    return (
      <>
        <PageBreadCrumb titleKey="titles.clientLoading" />
        <p className="text-theme-sm text-gray-500">Chargement…</p>
      </>
    );
  }

  const c = data as {
    firstName: string;
    lastName: string;
    phone: string;
    stats: { totalSpent: number; outstanding: number };
    events: Array<{ id: string; title: string; status: string }>;
  };

  return (
    <>
      <PageBreadCrumb pageTitle={`${c.firstName} ${c.lastName}`} />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ComponentCard title="Dépenses cumulées">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-brand-500" aria-hidden />
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatDZD(c.stats.totalSpent)}</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Montant impayé">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-orange-500" aria-hidden />
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatDZD(c.stats.outstanding)}</p>
            </div>
          </ComponentCard>
        </div>

        <ComponentCard
          title={
            <span className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-brand-500" aria-hidden />
              Événements
            </span>
          }
          desc={`Téléphone : ${c.phone || "—"}`}
        >
          <BasicTableSurface>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className={th}>
                    Titre
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Statut
                  </TableCell>
                  <TableCell isHeader className={`${th} w-28`}>
                    &nbsp;
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {!c.events?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                    >
                      Aucun événement lié.
                    </TableCell>
                  </TableRow>
                ) : (
                  c.events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90 sm:px-6">
                        {e.title}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6">
                        <Badge size="sm" color="primary" variant="light">
                          {e.status}
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
          </BasicTableSurface>
        </ComponentCard>
      </div>
    </>
  );
}

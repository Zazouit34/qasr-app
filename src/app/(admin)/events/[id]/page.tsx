"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, History, Layers, Users, Wallet } from "lucide-react";
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
import { formatDate, formatDZD } from "@/lib/utils";
import { paymentStatusBadgeColor } from "@/lib/payment-status-ui";
import { whatsappHref } from "@/lib/whatsapp";
import { toast } from "sonner";

type Tab =
  | "overview"
  | "payments"
  | "services"
  | "contract"
  | "checklist"
  | "reminders"
  | "history"
  | "staff"
  | "quotes";

const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Acompte",
  INSTALLMENT: "Échéance",
  FINAL_BALANCE: "Solde final",
  REFUND: "Remboursement",
  PENALTY: "Pénalité",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces",
  BANK_TRANSFER: "Virement",
  CHEQUE: "Chèque",
  CCP: "CCP",
  MOBILE_PAYMENT: "Mobile",
  OTHER: "Autre",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  OVERDUE: "En retard",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: "Mariage",
  ENGAGEMENT: "Fiançailles",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Corporate",
  BAPTISM: "Baptême",
  ANNIVERSARY: "Anniversaire de mariage",
  OTHER: "Autre",
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  INQUIRY: "Demande",
  QUOTE_SENT: "Devis envoyé",
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absent",
};

function eventStatusBadgeColor(status: string) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
      return "info";
    case "PENDING":
    case "QUOTE_SENT":
      return "warning";
    case "CANCELLED":
    case "NO_SHOW":
      return "error";
    default:
      return "light";
  }
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-1 border-b border-gray-100 py-2.5 text-theme-sm last:border-0 dark:border-white/[0.06]">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="break-words font-medium text-gray-800 dark:text-white/90">{children}</dd>
    </div>
  );
}

const VALID_TAB = new Set<Tab>([
  "overview",
  "payments",
  "services",
  "contract",
  "checklist",
  "reminders",
  "history",
  "staff",
  "quotes",
]);

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageBreadCrumb titleKey="titles.event" />
          <ComponentCard title="Événement" desc="">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Chargement…</p>
          </ComponentCard>
        </>
      }
    >
      <EventDetailBody />
    </Suspense>
  );
}

function EventDetailBody() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [assignRole, setAssignRole] = useState("Chef d’équipe");
  const [portalHint, setPortalHint] = useState<string | null>(null);

  useEffect(() => {
    const p = searchParams.get("tab");
    if (p && VALID_TAB.has(p as Tab)) setTab(p as Tab);
  }, [searchParams]);

  useEffect(() => {
    if (tab !== "staff") return;
    void fetch("/api/staff", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        setStaffList(
          ((j.data as Array<{ id: string; name: string; role: string }>) ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            role: s.role,
          })),
        );
      });
  }, [tab]);

  useEffect(() => {
    void fetch(`/api/events/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRaw(j.data);
        else toast.error(j.error);
      });
  }, [id]);

  const event = useMemo(() => {
    if (!raw) return null;
    return raw as {
      id: string;
      eventNumber: string;
      title: string;
      type: string;
      status: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      guestCount: number;
      groomName: string | null;
      brideName: string | null;
      groomPhone: string | null;
      bridePhone: string | null;
      basePrice: number;
      totalPrice: number;
      discountAmount: number;
      discountReason: string | null;
      notes: string | null;
      internalNotes: string | null;
      contractSigned: boolean;
      contractDate: string | null;
      client: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email: string | null;
        phone2: string | null;
        wilaya: string | null;
      };
      hall: { id: string; name: string } | null;
      paid: number;
      balance: number;
      payments: Array<{
        id: string;
        paymentNumber: string;
        amount: number;
        status: string;
        type: string;
        method: string;
        dueDate: string | null;
        paidAt: string | null;
      }>;
      services: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        status: string;
        notes: string | null;
        service: { name: string };
      }>;
      amenities: Array<{ id: string; notes: string | null; amenity: { name: string } }>;
      contracts: Array<{ id: string; status: string; signedAt: string | null }>;
      checklist: Array<{ id: string; label: string; isDone: boolean; category: string | null }>;
      reminders: Array<{
        id: string;
        message: string;
        dueDate: string;
        isDone: boolean;
        type: string;
      }>;
      assignments?: Array<{
        id: string;
        role: string;
        notes: string | null;
        staffMember: { id: string; name: string; role: string; phone: string };
      }>;
      quotes?: Array<{ id: string; quoteNumber: string; status: string; total: number }>;
      venue?: {
        slug: string;
        name?: string;
        phone?: string;
      };
      logs: Array<{
        id: string;
        action: string;
        createdAt: string;
        details: unknown;
        user: { name: string };
      }>;
    };
  }, [raw]);

  if (!event) {
    return (
      <>
        <PageBreadCrumb titleKey="titles.event" />
        <ComponentCard title="Événement" desc="">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">Chargement…</p>
        </ComponentCard>
      </>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Aperçu" },
    { id: "payments", label: "Paiements" },
    { id: "services", label: "Services" },
    { id: "contract", label: "Contrat" },
    { id: "staff", label: "Staff" },
    { id: "quotes", label: "Devis" },
    { id: "checklist", label: "Checklist" },
    { id: "reminders", label: "Rappels" },
    { id: "history", label: "Historique" },
  ];

  async function toggleChecklistItem(itemId: string, isDone: boolean) {
    const res = await fetch(`/api/checklist/${itemId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });
    const j = await res.json();
    if (!j.success) {
      toast.error(j.error ?? "Erreur");
      return;
    }
    setRaw((prev) => {
      if (!prev) return prev;
      const cl = (prev as { checklist?: Array<{ id: string; label: string; isDone: boolean; category: string | null }> }).checklist;
      if (!cl) return prev;
      return {
        ...prev,
        checklist: cl.map((c) => (c.id === itemId ? { ...c, isDone } : c)),
      };
    });
  }

  return (
    <>
      <PageBreadCrumb pageTitle={event.title} />
      <div className="space-y-6">
        <ComponentCard
          title={
            <span className="flex flex-wrap items-center gap-2">
              <CalendarDays className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
              <span>{event.title}</span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {event.eventNumber}
              </span>
            </span>
          }
          desc={`${formatDate(event.eventDate)} · ${EVENT_TYPE_LABELS[event.type] ?? event.type}${event.hall ? ` · ${event.hall.name}` : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="light" color={eventStatusBadgeColor(event.status)} size="sm">
              {EVENT_STATUS_LABELS[event.status] ?? event.status}
            </Badge>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/events/${id}/edit`}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                Modifier
              </Link>
              <button
                type="button"
                className="rounded-lg bg-error-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-error-600"
                onClick={async () => {
                  if (!confirm("Annuler cet événement ?")) return;
                  const r = await fetch(`/api/events/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                  });
                  const j = await r.json();
                  if (j.success) {
                    toast.success("Événement annulé");
                    router.push("/events");
                  } else toast.error(j.error);
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </ComponentCard>

        <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 dark:border-white/[0.05] dark:bg-white/[0.03]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                router.replace(`/events/${id}?tab=${t.id}`, { scroll: false });
              }}
              className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-brand-500 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ComponentCard title="Client" desc="Coordonnées et lien fiche">
              <dl>
                <DetailRow label="Nom">
                  <Link
                    href={`/clients/${event.client.id}`}
                    className="text-brand-600 hover:text-brand-500 dark:text-brand-400"
                  >
                    {event.client.firstName} {event.client.lastName}
                  </Link>
                </DetailRow>
                <DetailRow label="Téléphone">{event.client.phone}</DetailRow>
                {event.client.phone2 ? (
                  <DetailRow label="Tél. 2">{event.client.phone2}</DetailRow>
                ) : null}
                <DetailRow label="Email">{event.client.email ?? "—"}</DetailRow>
                <DetailRow label="Wilaya">{event.client.wilaya ?? "—"}</DetailRow>
              </dl>
            </ComponentCard>

            <ComponentCard title="Événement" desc="Lieu, horaires et capacité">
              <dl>
                <DetailRow label="Type">{EVENT_TYPE_LABELS[event.type] ?? event.type}</DetailRow>
                <DetailRow label="Salle">{event.hall?.name ?? "—"}</DetailRow>
                <DetailRow label="Horaires">
                  {event.startTime} — {event.endTime}
                </DetailRow>
                <DetailRow label="Invités">{event.guestCount}</DetailRow>
                <DetailRow label="Époux">{event.groomName ?? "—"}</DetailRow>
                <DetailRow label="Tél. époux">{event.groomPhone ?? "—"}</DetailRow>
                <DetailRow label="Épouse">{event.brideName ?? "—"}</DetailRow>
                <DetailRow label="Tél. épouse">{event.bridePhone ?? "—"}</DetailRow>
              </dl>
            </ComponentCard>

            <ComponentCard title="Financier" desc="Tarifs et encaissements">
              <dl>
                <DetailRow label="Prix de base">{formatDZD(event.basePrice)}</DetailRow>
                <DetailRow label="Remise">
                  {event.discountAmount > 0
                    ? `${formatDZD(event.discountAmount)}${event.discountReason ? ` (${event.discountReason})` : ""}`
                    : "—"}
                </DetailRow>
                <DetailRow label="Total">{formatDZD(event.totalPrice)}</DetailRow>
                <DetailRow label="Payé">{formatDZD(event.paid)}</DetailRow>
                <DetailRow label="Solde">
                  <span className={event.balance > 0 ? "text-error-600 dark:text-error-400" : "text-success-600 dark:text-success-400"}>
                    {formatDZD(event.balance)}
                  </span>
                </DetailRow>
              </dl>
            </ComponentCard>

            <ComponentCard title="Notes & contrat" desc="">
              <dl>
                <DetailRow label="Contrat">
                  {event.contractSigned ? `Signé${event.contractDate ? ` (${formatDate(event.contractDate)})` : ""}` : "Non signé"}
                </DetailRow>
                <DetailRow label="Notes client">
                  {event.notes ? <span className="whitespace-pre-wrap font-normal">{event.notes}</span> : "—"}
                </DetailRow>
                <DetailRow label="Notes internes">
                  {event.internalNotes ? (
                    <span className="whitespace-pre-wrap font-normal">{event.internalNotes}</span>
                  ) : (
                    "—"
                  )}
                </DetailRow>
              </dl>
            </ComponentCard>

            <ComponentCard title="WhatsApp, portail & impressions" desc="" className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 text-theme-sm">
                <a
                  href={whatsappHref(
                    event.client.phone,
                    `Bonjour ${event.client.firstName}, rappel pour « ${event.title} » (${formatDate(event.eventDate)}). Solde indiqué : ${formatDZD(event.balance)}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#128C7E] px-3 py-2 font-medium text-white hover:opacity-90"
                >
                  WhatsApp FR
                </a>
                <a
                  href={whatsappHref(
                    event.client.phone,
                    `السلام عليكم ${event.client.firstName}, تذكير بفعالية « ${event.title} » بتاريخ ${formatDate(event.eventDate)} — المتبقي حوالي ${Math.round(event.balance)} دج`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#128C7E]/90 px-3 py-2 font-medium text-white hover:opacity-90"
                  dir="rtl"
                >
                  واتساب AR
                </a>
                <Link href={`/events/${id}/briefing`} target="_blank" className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5">
                  Fiche événement
                </Link>
                <Link href={`/events/${id}/contract-print`} target="_blank" className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5">
                  Contrat imprimable
                </Link>
                {event.venue?.slug ? (
                  <Link
                    href={`/v/${event.venue.slug}/disponibilite`}
                    target="_blank"
                    className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5"
                  >
                    Lien disponibilités public
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg border border-brand-200 px-3 py-2 text-brand-700 dark:border-brand-500/40 dark:text-brand-300"
                  onClick={async () => {
                    const res = await fetch(`/api/events/${id}/guest-access`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: "{}",
                    });
                    const j = await res.json();
                    if (!j.success) {
                      toast.error(j.error ?? "Erreur");
                      return;
                    }
                    const full = `${window.location.origin}${j.data.path}`;
                    setPortalHint(full);
                    try {
                      await navigator.clipboard.writeText(full);
                      toast.success("Lien copié");
                    } catch {
                      toast.message(full);
                    }
                  }}
                >
                  Générer lien portail client
                </button>
              </div>
              {portalHint ? (
                <p className="mt-3 break-all text-theme-xs text-gray-600 dark:text-gray-400">{portalHint}</p>
              ) : null}
            </ComponentCard>

            {event.amenities?.length ? (
              <ComponentCard title="Équipements" desc="" className="lg:col-span-2">
                <ul className="flex flex-wrap gap-2">
                  {event.amenities.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-theme-sm dark:border-white/[0.08] dark:bg-white/[0.04]"
                    >
                      {a.amenity.name}
                      {a.notes ? <span className="text-theme-xs text-gray-500"> · {a.notes}</span> : null}
                    </li>
                  ))}
                </ul>
              </ComponentCard>
            ) : null}
          </div>
        )}

        {tab === "payments" && (
          <ComponentCard
            title={
              <span className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-brand-500" aria-hidden />
                Paiements
              </span>
            }
            desc={`Solde restant : ${formatDZD(event.balance)}`}
          >
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      N°
                    </TableCell>
                    <TableCell isHeader className={`${th} text-end`}>
                      Montant
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Type
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Mode
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Échéance
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Statut
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Reçu
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {!event.payments?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Aucun paiement enregistré.
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="px-5 py-4 font-medium text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                          {p.paymentNumber}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                          {formatDZD(p.amount)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300 sm:px-6">
                          {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300 sm:px-6">
                          {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                          {p.dueDate ? formatDate(p.dueDate) : "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 sm:px-6">
                          <Badge variant="light" color={paymentStatusBadgeColor(p.status)} size="sm">
                            {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 sm:px-6">
                          <Link
                            href={`/payments/${p.id}/receipt-print`}
                            target="_blank"
                            className="text-theme-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Reçu
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
          </ComponentCard>
        )}

        {tab === "services" && (
          <ComponentCard
            title={
              <span className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand-500" aria-hidden />
                Services
              </span>
            }
            desc="Lignes attachées à l’événement"
          >
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      Service
                    </TableCell>
                    <TableCell isHeader className={`${th} text-end`}>
                      Qté
                    </TableCell>
                    <TableCell isHeader className={`${th} text-end`}>
                      P.U.
                    </TableCell>
                    <TableCell isHeader className={`${th} text-end`}>
                      Total
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Statut
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {!event.services?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Aucun service. Ajoutez des lignes via l’API{" "}
                        <code className="rounded bg-gray-100 px-1 text-xs dark:bg-white/10">
                          POST /api/events/[id]/services
                        </code>
                        .
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.services.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                          {s.service.name}
                          {s.notes ? (
                            <span className="mt-0.5 block text-theme-xs font-normal text-gray-500">{s.notes}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm sm:px-6">{s.quantity}</TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm sm:px-6">{formatDZD(s.unitPrice)}</TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm font-medium sm:px-6">
                          {formatDZD(s.totalPrice)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm sm:px-6">{s.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
          </ComponentCard>
        )}

        {tab === "contract" && (
          <ComponentCard
            title={
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-500" aria-hidden />
                Contrats
              </span>
            }
            desc="Fichiers et statuts issus du dossier"
          >
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      Statut
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Signé le
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {!event.contracts?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Aucun contrat en base. La génération PDF pourra être branchée ici.
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.contracts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="px-5 py-4 text-theme-sm font-medium sm:px-6">{c.status}</TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                          {c.signedAt ? formatDate(c.signedAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
            <p className="mt-6 text-theme-sm text-gray-600 dark:text-gray-400">
              Génération contrat imprimable (FR | AR) ·{" "}
              <Link href={`/events/${id}/contract-print`} target="_blank" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                Ouvrir / Imprimer PDF
              </Link>
            </p>
          </ComponentCard>
        )}

        {tab === "staff" && (
          <ComponentCard
            title={
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-500" aria-hidden />
                Affectations
              </span>
            }
            desc="Chef d’équipe, service, mise en place…"
          >
            <div className="mb-8 grid gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-3">
              <label className="text-theme-sm font-medium">
                Membre du staff
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03]"
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                >
                  <option value="">—</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-theme-sm font-medium">
                Fonction pour cet événement
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm dark:border-gray-700 dark:bg-white/[0.03]"
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full rounded-lg bg-brand-500 py-2.5 text-theme-sm font-medium text-white hover:bg-brand-600"
                  onClick={async () => {
                    if (!assignStaffId.trim()) {
                      toast.error("Choisissez un membre.");
                      return;
                    }
                    const res = await fetch(`/api/events/${id}/assignments`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        staffMemberId: assignStaffId,
                        role: assignRole.trim() || "Rôle",
                      }),
                    });
                    const j = await res.json();
                    if (!j.success) {
                      toast.error(j.error ?? "Erreur");
                      return;
                    }
                    const ev = await fetch(`/api/events/${id}`, { credentials: "include" }).then((r) => r.json());
                    if (ev.success) setRaw(ev.data);
                    toast.success("Affectation ajoutée");
                  }}
                >
                  Ajouter
                </button>
              </div>
            </div>
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      Staff
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Rôle
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Tél.
                    </TableCell>
                    <TableCell isHeader className={`${th} w-24`}>
                      &nbsp;
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!(event.assignments && event.assignments.length) ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-5 py-8 text-center text-theme-sm text-gray-500">
                        Aucune affectation.
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="px-5 py-3 text-theme-sm font-medium">{a.staffMember.name}</TableCell>
                        <TableCell className="px-5 py-3 text-theme-sm">{a.role}</TableCell>
                        <TableCell className="px-5 py-3 text-theme-sm text-gray-600">{a.staffMember.phone}</TableCell>
                        <TableCell className="px-5 py-3 text-end">
                          <button
                            type="button"
                            className="text-theme-sm text-error-600 hover:underline"
                            onClick={async () => {
                              const res = await fetch(`/api/events/${id}/assignments/${a.id}`, {
                                method: "DELETE",
                                credentials: "include",
                              });
                              const j = await res.json();
                              if (!j.success) {
                                toast.error(j.error ?? "Erreur");
                                return;
                              }
                              const ev = await fetch(`/api/events/${id}`, { credentials: "include" }).then((r) =>
                                r.json(),
                              );
                              if (ev.success) setRaw(ev.data);
                            }}
                          >
                            Retirer
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
          </ComponentCard>
        )}

        {tab === "quotes" && (
          <ComponentCard title="Devis liés" desc="Acceptation en ligne possible via le lien public du devis.">
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      N°
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Statut
                    </TableCell>
                    <TableCell isHeader className={`${th} text-end`}>
                      Montant
                    </TableCell>
                    <TableCell isHeader className={th} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!(event.quotes && event.quotes.length) ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-5 py-8 text-center text-theme-sm text-gray-500">
                        Aucun devis rattaché. Créez-en depuis &quot;Devis&quot; ou associez un existant.
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.quotes.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="px-5 py-3 font-mono text-theme-sm">{q.quoteNumber}</TableCell>
                        <TableCell className="px-5 py-3 text-theme-sm">{q.status}</TableCell>
                        <TableCell className="px-5 py-3 text-end text-theme-sm font-medium">
                          {formatDZD(q.total)}
                        </TableCell>
                        <TableCell className="px-5 py-3 text-end">
                          <Link href={`/quotes/${q.id}`} className="text-theme-sm font-medium text-brand-600 hover:underline">
                            Ouvrir
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
            <div className="mt-4">
              <Link href="/quotes/new" className="text-theme-sm font-medium text-brand-600 hover:underline">
                + Nouveau devis
              </Link>
            </div>
          </ComponentCard>
        )}

        {tab === "checklist" && (
          <ComponentCard
            title={
              <span className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-brand-500" aria-hidden />
                Checklist
              </span>
            }
            desc="Cochez les tâches au fil de l’avancement — visible par toute l’équipe."
          >
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      Fait
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Tâche
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Catégorie
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {!event.checklist?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Aucun élément.
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.checklist.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="px-5 py-4 sm:px-6">
                          <input
                            type="checkbox"
                            checked={c.isDone}
                            onChange={(e) => void toggleChecklistItem(c.id, e.target.checked)}
                            aria-label={c.label}
                          />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                          {c.label}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400 sm:px-6">
                          {c.category ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
          </ComponentCard>
        )}

        {tab === "reminders" && (
          <ComponentCard title="Rappels" desc="">
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      Message
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Échéance
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Statut
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {!event.reminders?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Aucun rappel.
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.reminders.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                          {r.message}
                          <span className="mt-0.5 block text-theme-xs text-gray-500">{r.type}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                          {formatDate(r.dueDate)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm sm:px-6">{r.isDone ? "Fait" : "À faire"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
          </ComponentCard>
        )}

        {tab === "history" && (
          <ComponentCard
            title={
              <span className="flex items-center gap-2">
                <History className="h-5 w-5 text-brand-500" aria-hidden />
                Historique
              </span>
            }
            desc="Journal des actions sur cet événement"
          >
            <BasicTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className={th}>
                      Action
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Utilisateur
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Date
                    </TableCell>
                    <TableCell isHeader className={th}>
                      Détails
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {!event.logs?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Aucune entrée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    event.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="px-5 py-4 font-mono text-theme-xs text-gray-800 dark:text-white/90 sm:px-6">
                          {log.action}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm sm:px-6">{log.user?.name ?? "—"}</TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate px-5 py-4 text-theme-xs text-gray-500 sm:px-6">
                          {log.details != null ? JSON.stringify(log.details) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </BasicTableSurface>
          </ComponentCard>
        )}
      </div>
    </>
  );
}

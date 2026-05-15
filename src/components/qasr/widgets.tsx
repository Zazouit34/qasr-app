"use client";

export function EventCard(props: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="font-medium">{props.title}</div>
      {props.subtitle ? (
        <div className="text-sm text-gray-500">{props.subtitle}</div>
      ) : null}
    </div>
  );
}

export function PaymentBreakdown(props: { paid: number; total: number }) {
  const pct = props.total ? Math.min(100, (props.paid / props.total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
      <div
        className="h-full bg-success-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EventTimeline(props: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {props.items.map((t) => (
        <li key={t}>• {t}</li>
      ))}
    </ul>
  );
}

export function AvailabilityChecker(props: { message: string }) {
  return <p className="text-sm text-warning-600">{props.message}</p>;
}

export function QuickStats(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <div className="text-xs text-gray-500">{props.label}</div>
      <div className="text-lg font-semibold">{props.value}</div>
    </div>
  );
}

export function UpcomingEventsWidget() {
  return null;
}

export function PendingPaymentsWidget() {
  return null;
}

export function RecentActivityWidget() {
  return null;
}

export function ContractGenerator() {
  return null;
}

export function InvoicePrint() {
  return null;
}

export function EventChecklist() {
  return null;
}

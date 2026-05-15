import Badge from "@/components/ui/badge/Badge";
import type { PaymentStatus } from "@prisma/client";

const MAP: Record<
  PaymentStatus,
  { label: string; color: "success" | "error" | "warning" | "light" }
> = {
  PENDING: { label: "En attente", color: "warning" },
  PAID: { label: "Payé", color: "success" },
  OVERDUE: { label: "En retard", color: "error" },
  CANCELLED: { label: "Annulé", color: "light" },
  REFUNDED: { label: "Remboursé", color: "light" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const c = MAP[status];
  return (
    <Badge size="sm" variant="light" color={c.color}>
      {c.label}
    </Badge>
  );
}

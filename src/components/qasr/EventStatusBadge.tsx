import Badge from "@/components/ui/badge/Badge";
import type { EventStatus } from "@prisma/client";

const EVENT_STATUS_CONFIG: Record<
  EventStatus,
  { label: string; color: "primary" | "success" | "error" | "warning" | "light" }
> = {
  INQUIRY: { label: "Demande", color: "light" },
  QUOTE_SENT: { label: "Devis", color: "light" },
  PENDING: { label: "En attente", color: "warning" },
  CONFIRMED: { label: "Confirmé", color: "primary" },
  IN_PROGRESS: { label: "En cours", color: "primary" },
  COMPLETED: { label: "Terminé", color: "success" },
  CANCELLED: { label: "Annulé", color: "error" },
  NO_SHOW: { label: "Absent", color: "warning" },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const c = EVENT_STATUS_CONFIG[status];
  return (
    <Badge size="sm" color={c.color} variant="light">
      {c.label}
    </Badge>
  );
}

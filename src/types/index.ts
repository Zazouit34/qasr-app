import type {
  Event,
  Client,
  Payment,
  Service,
  Amenity,
  Package,
  StaffMember,
  Expense,
  ActivityLog,
} from "@prisma/client";

export type EventListItem = Event & {
  client: Pick<Client, "id" | "firstName" | "lastName">;
  hall: { id: string; name: string } | null;
  payments: Pick<Payment, "amount" | "status">[];
};

export type DashboardStatsPayload = {
  eventsThisMonth: number;
  revenueThisMonth: number;
  pendingPaymentsTotal: number;
  upcomingThisWeek: number;
  recentActivity: ActivityLog[];
  upcomingEvents: {
    id: string;
    eventDate: Date;
    title: string;
    type: string;
    guestCount: number;
    hallName: string | null;
    clientName: string;
  }[];
  pendingPayments: {
    id: string;
    amount: number;
    dueDate: Date | null;
    eventTitle: string;
    paymentNumber: string;
    status: string;
  }[];
  monthlyRevenue: { month: number; year: number; total: number }[];
  revenueYoY: { month: number; current: number; previous: number }[];
  statusBreakdown: Record<string, number>;
};

export type ClientWithStats = Client & {
  _count: { events: number };
};

export type ServiceWithCount = Service;

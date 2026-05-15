import { PrismaClient, EventStatus, EventType, PaymentStatus, PaymentType, ServiceCategory, ExpenseCategory, ClientSource } from "@prisma/client";
import bcrypt from "bcryptjs";

// Use direct connection for seed (pooled URL is for app runtime; CLI/seed often need DIRECT_URL)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

async function main() {
  await prisma.quote.deleteMany();
  await prisma.userVenue.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.eventService.deleteMany();
  await prisma.eventAmenity.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.document.deleteMany();
  await prisma.eventAssignment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.menuTemplate.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.packageItem.deleteMany();
  await prisma.package.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.service.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.client.deleteMany();
  await prisma.venueSettings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.venue.deleteMany();

  const venue = await prisma.venue.create({
    data: {
      name: "Salle Jasmin - Alger",
      slug: "salle-jasmin-alger",
      address: "Route de l’Hydra",
      city: "Alger",
      wilaya: "16 - Alger",
      phone: "+213 23 00 00 00",
      email: "contact@jasmin.dz",
      capacity: 1200,
      description: "Grande salle de réceptions.",
    },
  });

  await prisma.venueSettings.create({
    data: {
      venueId: venue.id,
      defaultDepositPct: 30,
      cancellationPolicyDays: 30,
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Qasr",
      email: "admin@qasr.dz",
      password: passwordHash,
      role: "VENUE_ADMIN",
      venueId: venue.id,
    },
  });
  await prisma.userVenue.create({
    data: { userId: admin.id, venueId: venue.id },
  });

  const halls = await Promise.all([
    prisma.hall.create({
      data: {
        venueId: venue.id,
        name: "Grande salle",
        capacity: 500,
        pricePerDay: 1_200_000,
      },
    }),
    prisma.hall.create({
      data: {
        venueId: venue.id,
        name: "Salle Prestige",
        capacity: 200,
        pricePerDay: 800_000,
      },
    }),
    prisma.hall.create({
      data: {
        venueId: venue.id,
        name: "Salle Jardin",
        capacity: 150,
        pricePerDay: 650_000,
      },
    }),
    prisma.hall.create({
      data: {
        venueId: venue.id,
        name: "Salle Or",
        capacity: 300,
        pricePerDay: 950_000,
      },
    }),
    prisma.hall.create({
      data: {
        venueId: venue.id,
        name: "Terrasse",
        capacity: 100,
        pricePerDay: 400_000,
      },
    }),
  ]);

  const serviceCategories: ServiceCategory[] = [
    "CATERING",
    "MUSIC",
    "PHOTO_VIDEO",
    "DECORATION",
    "CAKE",
    "FLOWERS",
    "LIGHTING",
    "TRANSPORT",
    "BEAUTY",
    "HOSTING",
    "SECURITY",
    "CLEANING",
    "OTHER",
    "CATERING",
    "MUSIC",
  ];
  const serviceNames = [
    "Traiteur royal",
    "DJ Live",
    "Photographe 4K",
    "Décoration florale",
    "Gâteau pièce montée",
    "Fleurs premium",
    "Éclairage scène",
    "Transport VIP",
    "Coiffure mariée",
    "MC / Animation",
    "Sécurité",
    "Nettoyage post-event",
    "Décoration générale",
    "Service buffet froid",
    "Sono complémentaire",
  ];

  for (let i = 0; i < 15; i++) {
    await prisma.service.create({
      data: {
        venueId: venue.id,
        name: serviceNames[i] ?? `Service ${i + 1}`,
        category: serviceCategories[i] ?? "OTHER",
        price: 50_000 + i * 5_000,
        isActive: true,
      },
    });
  }

  const amenityNames = [
    "Parking (200+)",
    "Salle de prière",
    "Chambre de la mariée",
    "Chambre du marié",
    "Climatisation",
    "Chauffage",
    "Sonorisation pro",
    "Éclairage scénique",
    "Vestiaires & douches",
    "Jardin extérieur",
    "Projecteur / écran",
    "Accès handicapés",
    "Sécurité",
    "Ménage inclus",
  ];

  let sort = 0;
  for (const n of amenityNames) {
    await prisma.amenity.create({
      data: {
        venueId: venue.id,
        name: n,
        sortOrder: sort++,
        isIncluded: true,
      },
    });
  }

  const pack = async (name: string, price: number, min?: number, max?: number) => {
    await prisma.package.create({
      data: {
        venueId: venue.id,
        name,
        basePrice: price,
        minGuests: min,
        maxGuests: max,
        items: {
          create: [
            { label: "Salle privatisable", isIncluded: true },
            { label: "Buffet standard", isIncluded: true },
            { label: "Décoration de base", isIncluded: true },
          ],
        },
      },
    });
  };
  await pack("Argent", 350_000, 100, 250);
  await pack("Or", 600_000, 150, 350);
  await pack("Prestige", 1_200_000, 200, 500);

  const clients: { id: string }[] = [];
  const firstNames = ["Yacine", "Amel", "Khaled", "Sara", "Mehdi", "Nour", "Karim", "Lina", "Omar", "Houda"];
  const lastNames = ["Benali", "Kahla", "Boudiaf", "Cherif", "Hamidi", "Mansouri", "Ziani", "Saadi", "Benyahia", "Amrani"];

  for (let i = 0; i < 20; i++) {
    const c = await prisma.client.create({
      data: {
        venueId: venue.id,
        firstName: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        phone: `+213 555 ${String(10 + i).padStart(3, "0")} ${String(20 + i).padStart(3, "0")}`,
        wilaya: "16 - Alger",
        source: ClientSource.WALK_IN,
        isVIP: i % 7 === 0,
      },
    });
    clients.push(c);
  }

  const statuses: EventStatus[] = [
    "INQUIRY",
    "QUOTE_SENT",
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ];
  const types: EventType[] = [
    "WEDDING",
    "ENGAGEMENT",
    "BIRTHDAY",
    "CORPORATE",
    "OTHER",
  ];

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - 4 + Math.floor(i / 5));
    d.setDate(5 + (i % 20));

    const year = d.getFullYear();
    const eventNumber = `EVT-${year}-${String(i + 1).padStart(4, "0")}`;

    const client = clients[i % clients.length];
    const hall = halls[i % halls.length];

    const evt = await prisma.event.create({
      data: {
        venueId: venue.id,
        clientId: client.id,
        hallId: hall.id,
        eventNumber,
        title: `Réception ${i + 1} — ${client.id.slice(-4)}`,
        type: types[i % types.length],
        status: statuses[i % statuses.length],
        eventDate: d,
        startTime: "18:00",
        endTime: "02:00",
        guestCount: 80 + i * 3,
        basePrice: 500_000,
        totalPrice: 800_000 + i * 10_000,
        discountAmount: i % 4 === 0 ? 20_000 : 0,
        brideName: "Sara",
        groomName: "Yacine",
      },
    });

    await prisma.payment.create({
      data: {
        venueId: venue.id,
        eventId: evt.id,
        paymentNumber: `PAY-${year}-${String(i * 2 + 1).padStart(4, "0")}`,
        amount: 200_000 + i * 5000,
        type: PaymentType.DEPOSIT,
        status:
          i % 3 === 0
            ? PaymentStatus.PENDING
            : i % 3 === 1
              ? PaymentStatus.PAID
              : PaymentStatus.PAID,
        method: "BANK_TRANSFER",
        dueDate: new Date(d.getTime() - 86400000 * 10),
        paidAt: i % 3 === 0 ? null : new Date(),
      },
    });

    if (i % 5 === 0) {
      await prisma.payment.create({
        data: {
          venueId: venue.id,
          eventId: evt.id,
          paymentNumber: `PAY-${year}-${String(i * 2 + 2).padStart(4, "0")}`,
          amount: 150_000,
          type: PaymentType.INSTALLMENT,
          status: PaymentStatus.PENDING,
          method: "CASH",
          dueDate: new Date(d.getTime() - 86400000 * 2),
        },
      });
    }
  }

  for (let i = 0; i < 10; i++) {
    await prisma.expense.create({
      data: {
        venueId: venue.id,
        category: Object.values(ExpenseCategory)[i % 8],
        description: `Dépense ${i + 1}`,
        amount: 15_000 + i * 2000,
        date: new Date(2026, i % 12, 5 + i),
        vendor: `Fournisseur ${i}`,
      },
    });
  }

  await prisma.staffMember.create({
    data: {
      venueId: venue.id,
      name: "Ahmed Hall Manager",
      role: "Responsable salle",
      phone: "+213 555 111 222",
      joinDate: new Date(2022, 0, 1),
      salary: 80_000,
    },
  });

  console.log("Seed OK – connexion: admin@qasr.dz / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

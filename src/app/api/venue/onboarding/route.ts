import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const stepSchema = z.object({
  venue: z.boolean().optional(),
  halls: z.boolean().optional(),
  services: z.boolean().optional(),
  servicesSkipped: z.boolean().optional(),
  menus: z.boolean().optional(),
  menusSkipped: z.boolean().optional(),
  amenities: z.boolean().optional(),
  package: z.boolean().optional(),
  packageSkipped: z.boolean().optional(),
  finish: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "settings:update");
  if (deny) return deny;

  let body: z.infer<typeof stepSchema>;
  try {
    body = stepSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const venueId = ctx.user.venueId;
  const now = new Date();

  const data: Record<string, Date> = {};
  if (body.venue) data.onboardingVenueCompletedAt = now;
  if (body.halls) data.onboardingHallsCompletedAt = now;
  if (body.services) data.onboardingServicesCompletedAt = now;
  if (body.servicesSkipped) data.onboardingServicesSkippedAt = now;
  if (body.menus) data.onboardingMenusCompletedAt = now;
  if (body.menusSkipped) data.onboardingMenusSkippedAt = now;
  if (body.amenities) data.onboardingAmenitiesCompletedAt = now;
  if (body.package) data.onboardingPackageCompletedAt = now;
  if (body.packageSkipped) data.onboardingPackageSkippedAt = now;
  if (body.finish) data.onboardingFinishedAt = now;

  const existing = await prisma.venueSettings.findUnique({ where: { venueId } });
  if (!existing) {
    await prisma.venueSettings.create({ data: { venueId, ...data } });
  } else if (Object.keys(data).length) {
    await prisma.venueSettings.update({ where: { venueId }, data });
  }

  const refreshed = await prisma.venueSettings.findUnique({
    where: { venueId },
  });

  const [hallCount, svcCount, amenityCount, pkgCount, menuCount] = await Promise.all([
    prisma.hall.count({ where: { venueId, isActive: true } }),
    prisma.service.count({ where: { venueId, isActive: true } }),
    prisma.amenity.count({ where: { venueId, isActive: true } }),
    prisma.package.count({ where: { venueId, isActive: true } }),
    prisma.menuTemplate.count({ where: { venueId } }),
  ]);

  const st = refreshed!;
  let weight = 0;
  let completed = 0;
  const add = (w: number, ok: boolean) => {
    weight += w;
    if (ok) completed += w;
  };
  add(20, !!st.onboardingVenueCompletedAt);
  add(20, hallCount > 0 || !!st.onboardingHallsCompletedAt);
  add(
    15,
    svcCount > 0 || !!st.onboardingServicesCompletedAt || !!st.onboardingServicesSkippedAt,
  );
  add(10, menuCount > 0 || !!st.onboardingMenusCompletedAt || !!st.onboardingMenusSkippedAt);
  add(15, amenityCount > 0 || !!st.onboardingAmenitiesCompletedAt);
  add(
    20,
    pkgCount > 0 || !!st.onboardingPackageCompletedAt || !!st.onboardingPackageSkippedAt,
  );

  const percent = weight > 0 ? Math.round((completed / weight) * 100) : 0;

  return apiOk({
    settings: st,
    counts: {
      halls: hallCount,
      services: svcCount,
      amenities: amenityCount,
      packages: pkgCount,
      menus: menuCount,
    },
    percentComplete: percent,
    isFinished: !!st.onboardingFinishedAt,
  });
}

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  const venueId = ctx.user.venueId;
  let settings = await prisma.venueSettings.findUnique({ where: { venueId } });
  if (!settings) settings = await prisma.venueSettings.create({ data: { venueId } });

  const [hallCount, svcCount, amenityCount, pkgCount, menuCount] = await Promise.all([
    prisma.hall.count({ where: { venueId, isActive: true } }),
    prisma.service.count({ where: { venueId, isActive: true } }),
    prisma.amenity.count({ where: { venueId, isActive: true } }),
    prisma.package.count({ where: { venueId, isActive: true } }),
    prisma.menuTemplate.count({ where: { venueId } }),
  ]);

  const st = settings;
  let weight = 0;
  let done = 0;
  const add = (w: number, ok: boolean) => {
    weight += w;
    if (ok) done += w;
  };
  add(20, !!st.onboardingVenueCompletedAt);
  add(20, hallCount > 0 || !!st.onboardingHallsCompletedAt);
  add(15, svcCount > 0 || !!st.onboardingServicesCompletedAt || !!st.onboardingServicesSkippedAt);
  add(10, menuCount > 0 || !!st.onboardingMenusCompletedAt || !!st.onboardingMenusSkippedAt);
  add(15, amenityCount > 0 || !!st.onboardingAmenitiesCompletedAt);
  add(20, pkgCount > 0 || !!st.onboardingPackageCompletedAt || !!st.onboardingPackageSkippedAt);

  const percent = weight > 0 ? Math.round((done / weight) * 100) : 0;

  return apiOk({
    settings: st,
    counts: { halls: hallCount, services: svcCount, amenities: amenityCount, packages: pkgCount, menus: menuCount },
    percentComplete: percent,
    isFinished: !!st.onboardingFinishedAt,
  });
}

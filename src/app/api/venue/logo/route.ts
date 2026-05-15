import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import prisma from "@/lib/prisma";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export async function POST(req: Request) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "settings:update");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError("Formulaire invalide", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return apiError("Fichier requis", 400);
  if (file.size > MAX_SIZE) return apiError("Logo trop volumineux (max 2 Mo)", 400);
  if (!ALLOWED.has(file.type)) return apiError("Format accepté : JPG, PNG, WebP, SVG", 400);

  const venueId = ctx.user.venueId;
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/svg+xml"
          ? "svg"
          : "jpg";
  const fname = `${venueId}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "venues");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, fname), buf);

  const logoUrl = `/uploads/venues/${fname}`;
  await prisma.venue.update({
    where: { id: venueId },
    data: { logoUrl },
  });

  return apiOk({ logoUrl });
}

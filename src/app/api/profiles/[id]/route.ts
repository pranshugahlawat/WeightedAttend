import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";

const PatchSchema = z.object({
  name: z.string().min(2).max(80)
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    // ensure profile belongs to user
    const profile = await prisma.timetableProfile.findFirst({
      where: { id: params.id, userId }
    });
    if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

    // unique per user
    const exists = await prisma.timetableProfile.findFirst({
      where: { userId, name: parsed.data.name, NOT: { id: params.id } }
    });
    if (exists) return Response.json({ error: "Profile name already exists" }, { status: 409 });

    const updated = await prisma.timetableProfile.update({
      where: { id: params.id },
      data: { name: parsed.data.name }
    });

    return Response.json({ profile: updated });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();

    const profile = await prisma.timetableProfile.findFirst({
      where: { id: params.id, userId }
    });
    if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

    // If deleting current active profile -> switch active to another default/remaining profile
    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    await prisma.timetableProfile.delete({ where: { id: params.id } }); // cascades entries -> sessions

    if (settings?.activeProfileId === params.id) {
      const fallback = await prisma.timetableProfile.findFirst({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
      });

      await prisma.userSettings.update({
        where: { userId },
        data: { activeProfileId: fallback?.id ?? null }
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";
import { NextRequest } from "next/server";

const PatchSchema = z.object({
  name: z.string().min(2).max(80)
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const profile = await prisma.timetableProfile.findFirst({ where: { id, userId } });
    if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

    const exists = await prisma.timetableProfile.findFirst({
      where: { userId, name: parsed.data.name, NOT: { id } }
    });
    if (exists) return Response.json({ error: "Profile name already exists" }, { status: 409 });

    const updated = await prisma.timetableProfile.update({
      where: { id },
      data: { name: parsed.data.name }
    });

    return Response.json({ profile: updated });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const profile = await prisma.timetableProfile.findFirst({ where: { id, userId } });
    if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    await prisma.timetableProfile.delete({ where: { id } }); // cascade deletes entries/sessions

    if (settings?.activeProfileId === id) {
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
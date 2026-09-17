import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { NextRequest } from "next/server";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const profile = await prisma.timetableProfile.findFirst({
      where: { id, userId }
    });
    if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

    await prisma.timetableProfile.updateMany({
      where: { userId },
      data: { isDefault: false }
    });

    await prisma.timetableProfile.update({
      where: { id },
      data: { isDefault: true }
    });

    // If no active profile, set this as active
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.activeProfileId) {
      await prisma.userSettings.update({
        where: { userId },
        data: { activeProfileId: id }
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
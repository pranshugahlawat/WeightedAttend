import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();

    const profile = await prisma.timetableProfile.findFirst({
      where: { id: params.id, userId }
    });
    if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

    await prisma.timetableProfile.updateMany({
      where: { userId },
      data: { isDefault: false }
    });

    await prisma.timetableProfile.update({
      where: { id: params.id },
      data: { isDefault: true }
    });

    // If user has no active profile, set this as active too
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.activeProfileId) {
      await prisma.userSettings.update({
        where: { userId },
        data: { activeProfileId: params.id }
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
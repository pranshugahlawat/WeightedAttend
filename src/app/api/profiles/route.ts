import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";

export async function GET() {
  try {
    const userId = await requireUserId();
    const profiles = await prisma.timetableProfile.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
    return Response.json({ profiles });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";

const PutSchema = z.object({
  activeProfileId: z.string().nullable(),
  activeLabGroup: z.enum(["A", "B", "C", "D"])
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    return Response.json({ settings });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);
    const parsed = PutSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const settings = await prisma.userSettings.update({
      where: { userId },
      data: {
        activeProfileId: parsed.data.activeProfileId,
        activeLabGroup: parsed.data.activeLabGroup
      }
    });

    return Response.json({ settings });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
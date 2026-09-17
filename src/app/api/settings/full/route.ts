import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";

const PutSchema = z.object({
  targetPercent: z.number().int().min(1).max(100),
  countryCode: z.string().min(2).max(2)
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
        targetPercent: parsed.data.targetPercent,
        countryCode: parsed.data.countryCode.toUpperCase()
      }
    });

    return Response.json({ settings });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
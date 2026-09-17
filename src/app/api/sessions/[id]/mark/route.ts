import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";
import { NextRequest } from "next/server";

const Schema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "CANCELLED"])
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    // ensure owned
    const session = await prisma.classSession.findFirst({ where: { id, userId } });
    if (!session) return Response.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.classSession.update({
      where: { id },
      data: { status: parsed.data.status }
    });

    return Response.json({ session: updated });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
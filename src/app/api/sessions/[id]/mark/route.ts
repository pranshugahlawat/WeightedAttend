import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";
import { NextRequest } from "next/server";

const Schema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "CANCELLED"])
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

  const session = await prisma.classSession.findFirst({ where: { id, userId } });
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });

  if (session.lockedAt) {
    return Response.json({ error: "This class is locked and cannot be changed." }, { status: 409 });
  }

  const updated = await prisma.classSession.update({
    where: { id },
    data: { status: parsed.data.status, lockedAt: new Date() }
  });

  return Response.json({ session: updated });
}
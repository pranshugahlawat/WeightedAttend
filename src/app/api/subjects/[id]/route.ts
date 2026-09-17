import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";
import { NextRequest } from "next/server";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  color: z.string().optional()
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const subject = await prisma.subject.findFirst({ where: { id, userId } });
    if (!subject) return Response.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name: parsed.data.name?.trim(),
        code: parsed.data.code?.trim() || undefined,
        color: parsed.data.color?.trim() || undefined
      }
    });

    return Response.json({ subject: updated });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;

    const subject = await prisma.subject.findFirst({ where: { id, userId } });
    if (!subject) return Response.json({ error: "Not found" }, { status: 404 });

    await prisma.subject.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  color: z.string().optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const subject = await prisma.subject.update({
      where: { id: params.id, userId },
      data: {
        name: parsed.data.name?.trim(),
        code: parsed.data.code?.trim() || undefined,
        color: parsed.data.color?.trim() || undefined
      }
    });

    return Response.json({ subject });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    await prisma.subject.delete({ where: { id: params.id, userId } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
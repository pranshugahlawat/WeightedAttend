import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  color: z.string().optional()
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return Response.json({ subjects });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const name = parsed.data.name.trim();

    const subject = await prisma.subject.upsert({
      where: { userId_name: { userId, name } },
      update: {
        code: parsed.data.code?.trim() || null,
        color: parsed.data.color?.trim() || null
      },
      create: {
        userId,
        name,
        code: parsed.data.code?.trim() || null,
        color: parsed.data.color?.trim() || null
      }
    });

    return Response.json({ subject });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
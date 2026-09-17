import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";

const Schema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "CANCELLED"])
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const session = await prisma.classSession.update({
      where: { id: params.id, userId },
      data: { status: parsed.data.status }
    });

    return Response.json({ session });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
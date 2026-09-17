import { requireUserId } from "@/lib/requireUser";
import { computeSubjectStats } from "@/lib/stats";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ subjectId: string }> }) {
  try {
    const userId = await requireUserId();
    const { subjectId } = await ctx.params;

    const stats = await computeSubjectStats(userId, subjectId);
    return Response.json(stats);
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
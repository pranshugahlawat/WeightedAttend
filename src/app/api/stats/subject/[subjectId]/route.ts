import { requireUserId } from "@/lib/requireUser";
import { computeSubjectStats } from "@/lib/stats";

export async function GET(_req: Request, { params }: { params: { subjectId: string } }) {
  try {
    const userId = await requireUserId();
    const stats = await computeSubjectStats(userId, params.subjectId);
    return Response.json(stats);
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
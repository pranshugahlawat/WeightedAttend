import { requireUserId } from "@/lib/requireUser";
import { computeDailySeries, computeOverallStats } from "@/lib/stats";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const seriesDays = Number(url.searchParams.get("seriesDays") ?? "0");

    const overall = await computeOverallStats(userId);
    const series = seriesDays > 0 ? await computeDailySeries(userId, seriesDays) : [];

    return Response.json({ ...overall, series });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { toISODateUTC } from "@/lib/dates";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.activeProfileId) return Response.json({ events: [] });

    const url = new URL(req.url);
    const monthOffset = Number(url.searchParams.get("monthOffset") ?? "0");

    const now = new Date();
    const start = startOfMonth(addMonths(now, monthOffset));
    const end = endOfMonth(addMonths(now, monthOffset));

    const [holidays, sessions] = await Promise.all([
      prisma.holiday.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      prisma.classSession.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          timetableEntry: {
            profileId: settings.activeProfileId,
            OR: [{ labGroup: null }, { labGroup: settings.activeLabGroup }]
          }
        },
        include: { timetableEntry: true }
      })
    ]);

    // Day marker color: if any absent -> red else if present -> green
    const dayStatus = new Map<string, { present: number; absent: number }>();
    for (const s of sessions) {
      if (s.status === "CANCELLED") continue;
      const key = toISODateUTC(new Date(s.date));
      const cur = dayStatus.get(key) ?? { present: 0, absent: 0 };
      const w = s.timetableEntry.weight;
      if (s.status === "PRESENT") cur.present += w;
      if (s.status === "ABSENT") cur.absent += w;
      dayStatus.set(key, cur);
    }

    const events = [
      ...holidays.map((h) => ({
        title: `Holiday: ${h.name}`,
        start: toISODateUTC(new Date(h.date)),
        allDay: true,
        color: "#f59e0b"
      })),
      ...Array.from(dayStatus.entries()).map(([date, st]) => ({
        title: st.absent > 0 ? "Absent marked" : st.present > 0 ? "Present marked" : "No data",
        start: date,
        allDay: true,
        color: st.absent > 0 ? "#dc2626" : "#16a34a"
      }))
    ];

    return Response.json({ events });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
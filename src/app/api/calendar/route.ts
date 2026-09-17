import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { addMonths, endOfMonth, startOfMonth, eachDayOfInterval, format } from "date-fns";
import { weekday0Sun } from "@/lib/dates";
import { NextRequest } from "next/server";

function dateOnly(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.activeProfileId) return Response.json({ events: [] });

    const url = new URL(req.url);
    const monthOffset = Number(url.searchParams.get("monthOffset") ?? "0");

    const now = new Date();
    const start = startOfMonth(addMonths(now, monthOffset));
    const end = endOfMonth(addMonths(now, monthOffset));
    const days = eachDayOfInterval({ start, end });

    const [holidays, entries, sessions] = await Promise.all([
      prisma.holiday.findMany({ where: { userId, date: { gte: start, lte: end } } }),

      prisma.timetableEntry.findMany({
        where: {
          userId,
          profileId: settings.activeProfileId,
          validFrom: { lte: end },
          OR: [{ validTo: null }, { validTo: { gte: start } }],
          AND: [{ OR: [{ labGroup: null }, { labGroup: settings.activeLabGroup }] }]
        },
        include: { subject: true }
      }),

      prisma.classSession.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          timetableEntry: {
            profileId: settings.activeProfileId,
            OR: [{ labGroup: null }, { labGroup: settings.activeLabGroup }]
          }
        },
        select: { timetableEntryId: true, date: true, status: true }
      })
    ]);

    // Map: dateStr -> (entryId -> status)
    const statusMap = new Map<string, Map<string, string>>();
    for (const s of sessions) {
      const key = format(new Date(s.date), "yyyy-MM-dd");
      const inner = statusMap.get(key) ?? new Map<string, string>();
      inner.set(s.timetableEntryId, s.status);
      statusMap.set(key, inner);
    }

    const events: any[] = [];

    // Holidays (all-day)
    for (const h of holidays) {
      events.push({
        title: `Holiday: ${h.name}`,
        start: format(new Date(h.date), "yyyy-MM-dd"),
        allDay: true,
        color: "#f59e0b"
      });
    }

    // Scheduled classes (timed)
    for (const d of days) {
      const dateStr = format(d, "yyyy-MM-dd");
      const wd = weekday0Sun(dateOnly(d));

      const applicable = entries.filter((e) => {
        const dd = dateOnly(d);
        const inRange = e.validFrom <= dd && (e.validTo === null || e.validTo >= dd);
        return inRange && e.weekday === wd;
      });

      const dayStatuses = statusMap.get(dateStr) ?? new Map<string, string>();

      for (const e of applicable) {
        const st = dayStatuses.get(e.id); // PRESENT/ABSENT/CANCELLED or undefined
        const statusTag =
          st === "PRESENT" ? "[P]" : st === "ABSENT" ? "[A]" : st === "CANCELLED" ? "[C]" : "[ ]";

        const titleParts = [
          `${statusTag} ${e.subject.name}`,
          e.location ? `(${e.location})` : "",
          e.labGroup ? `G:${e.labGroup}` : "",
          `w:${e.weight}`
        ].filter(Boolean);

        const color =
          st === "ABSENT" ? "#dc2626" :
          st === "PRESENT" ? "#16a34a" :
          st === "CANCELLED" ? "#6b7280" :
          "#2563eb"; // not yet marked

        events.push({
          title: titleParts.join(" "),
          start: `${dateStr}T${e.startTime}:00`,
          end: `${dateStr}T${e.endTime}:00`,
          allDay: false,
          color
        });
      }
    }

    return Response.json({ events });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error(e);
    return Response.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
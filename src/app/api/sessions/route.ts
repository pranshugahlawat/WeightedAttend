import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { parseISODateUTC, weekday0Sun } from "@/lib/dates";
import { z } from "zod";
import { SessionStatus } from "@prisma/client";

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();

    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date") ?? "";
    const parsed = DateSchema.safeParse(dateStr);
    if (!parsed.success) return Response.json({ error: "Invalid date" }, { status: 400 });

    const date = parseISODateUTC(dateStr);

    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.activeProfileId) {
      return Response.json({ error: "Select a section (import timetable) first." }, { status: 400 });
    }

    // Holiday check
    const holiday = await prisma.holiday.findUnique({
      where: { userId_date: { userId, date } }
    });
    if (holiday) return Response.json({ holiday: { name: holiday.name }, sessions: [] });

    const weekday = weekday0Sun(date);

    // Get timetable entries for this date (active profile + lab group filter + validity range)
    const entries = await prisma.timetableEntry.findMany({
      where: {
        userId,
        profileId: settings.activeProfileId,
        weekday,
        validFrom: { lte: date },
        OR: [{ validTo: null }, { validTo: { gte: date } }],
        AND: [{ OR: [{ labGroup: null }, { labGroup: settings.activeLabGroup }] }]
      }
    });

    // Ensure sessions exist
    for (const e of entries) {
      await prisma.classSession.upsert({
        where: { timetableEntryId_date: { timetableEntryId: e.id, date } },
        update: {},
        create: {
          userId,
          timetableEntryId: e.id,
          date,
          status: SessionStatus.PRESENT,
          lockedAt: null
        }
      });
    }

    const sessions = await prisma.classSession.findMany({
      where: { userId, date },
      include: { timetableEntry: { include: { subject: true } } },
      orderBy: [{ timetableEntry: { startTime: "asc" } }]
    });

    return Response.json({ holiday: null, sessions });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date") ?? "";
    const parsed = DateSchema.safeParse(dateStr);
    if (!parsed.success) return Response.json({ error: "Invalid date" }, { status: 400 });

    const date = parseISODateUTC(dateStr);

    const sessions = await prisma.classSession.findMany({
      where: { userId, date },
      include: { timetableEntry: { include: { subject: true } } },
      orderBy: [{ timetableEntry: { startTime: "asc" } }]
    });

    return Response.json({ sessions });
  } catch (e: any) {
  if (e?.message === "UNAUTHORIZED") {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  console.error("sessions route error:", e);
  return Response.json({ error: e?.message ?? "Internal error" }, { status: 500 });
}
}
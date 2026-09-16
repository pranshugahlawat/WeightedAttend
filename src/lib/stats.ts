import { prisma } from "@/lib/db";
import { SessionStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { toISODateUTC } from "@/lib/dates";
import { getActiveContext } from "@/lib/context";

function isConducted(status: SessionStatus) {
  return status === SessionStatus.PRESENT || status === SessionStatus.ABSENT;
}

export async function computeOverallStats(userId: string) {
  const ctx = await getActiveContext(userId);
  if (!ctx.activeProfileId) return { presentW: 0, conductedW: 0, percent: 0, targetPercent: ctx.targetPercent };

  const sessions = await prisma.classSession.findMany({
    where: {
      userId,
      timetableEntry: {
        profileId: ctx.activeProfileId,
        OR: [{ labGroup: null }, { labGroup: ctx.activeLabGroup as any }]
      }
    },
    include: { timetableEntry: true }
  });

  let presentW = 0;
  let conductedW = 0;

  for (const s of sessions) {
    if (s.status === SessionStatus.CANCELLED) continue;
    const w = s.timetableEntry.weight;
    if (s.status === SessionStatus.PRESENT) presentW += w;
    if (isConducted(s.status)) conductedW += w;
  }

  const percent = conductedW === 0 ? 0 : (presentW / conductedW) * 100;
  return { presentW, conductedW, percent, targetPercent: ctx.targetPercent };
}

export async function computeSubjectStats(userId: string, subjectId: string) {
  const ctx = await getActiveContext(userId);
  if (!ctx.activeProfileId) return { presentW: 0, conductedW: 0, percent: 0 };

  const sessions = await prisma.classSession.findMany({
    where: {
      userId,
      timetableEntry: {
        profileId: ctx.activeProfileId,
        subjectId,
        OR: [{ labGroup: null }, { labGroup: ctx.activeLabGroup as any }]
      }
    },
    include: { timetableEntry: true }
  });

  let presentW = 0;
  let conductedW = 0;

  for (const s of sessions) {
    if (s.status === SessionStatus.CANCELLED) continue;
    const w = s.timetableEntry.weight;
    if (s.status === SessionStatus.PRESENT) presentW += w;
    if (isConducted(s.status)) conductedW += w;
  }

  const percent = conductedW === 0 ? 0 : (presentW / conductedW) * 100;
  return { presentW, conductedW, percent };
}

export async function computeDailySeries(userId: string, days: number) {
  const ctx = await getActiveContext(userId);
  if (!ctx.activeProfileId) return [];

  const from = subDays(new Date(), days - 1);

  const sessions = await prisma.classSession.findMany({
    where: {
      userId,
      date: { gte: from },
      timetableEntry: {
        profileId: ctx.activeProfileId,
        OR: [{ labGroup: null }, { labGroup: ctx.activeLabGroup as any }]
      }
    },
    include: { timetableEntry: true },
    orderBy: { date: "asc" }
  });

  const byDate = new Map<string, { present: number; conducted: number }>();

  for (const s of sessions) {
    if (s.status === SessionStatus.CANCELLED) continue;

    const key = toISODateUTC(new Date(s.date));
    const w = s.timetableEntry.weight;

    const cur = byDate.get(key) ?? { present: 0, conducted: 0 };
    if (s.status === SessionStatus.PRESENT) cur.present += w;
    if (isConducted(s.status)) cur.conducted += w;
    byDate.set(key, cur);
  }

  return Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    percent: v.conducted === 0 ? 0 : Math.round((v.present / v.conducted) * 1000) / 10
  }));
}
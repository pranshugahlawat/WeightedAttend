import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { z } from "zod";
import { parseISODateUTC } from "@/lib/dates";

const CreateSchema = z.object({
  subjectId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  weight: z.number().int().min(1).max(5),
  location: z.string().nullable().optional(),
  labGroup: z.enum(["A", "B", "C", "D"]).nullable().optional()
});

const ApplySchema = z.object({
  profileName: z.string().min(2),
  makeDefault: z.boolean().optional().default(true),
  applyFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activeLabGroup: z.enum(["A", "B", "C", "D"]),
  timeSlots: z.array(z.object({ label: z.string(), start: z.string(), end: z.string() })),
  entries: z.array(z.object({
    weekday: z.number().int().min(1).max(5),
    slotIndex: z.number().int().min(0).max(7),
    course: z.string().min(2),
    room: z.string().nullable().optional(),
    labGroup: z.enum(["A","B","C","D"]).nullable(),
    weight: z.number().int().min(1).max(5)
  }))
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    const url = new URL(req.url);
    const profileId = url.searchParams.get("profileId") ?? settings?.activeProfileId ?? null;

    if (!profileId) return Response.json({ entries: [] });

    const entries = await prisma.timetableEntry.findMany({
      where: { userId, profileId },
      include: { subject: true },
      orderBy: [{ validTo: "asc" }, { weekday: "asc" }, { startTime: "asc" }]
    });

    return Response.json({ entries });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.activeProfileId) {
      return Response.json({ error: "No active section selected. Import timetable first." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const today = new Date();
    const validFrom = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const entry = await prisma.timetableEntry.create({
      data: {
        userId,
        profileId: settings.activeProfileId,
        subjectId: parsed.data.subjectId,
        weekday: parsed.data.weekday,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        weight: parsed.data.weight,
        location: parsed.data.location?.trim() || null,
        labGroup: (parsed.data.labGroup ?? null) as any,
        validFrom,
        validTo: null
      }
    });

    return Response.json({ entry });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

/**
 * OCR APPLY:
 * - creates/updates a profile for detected section
 * - sets it DEFAULT (makeDefault=true)
 * - sets it ACTIVE (activeProfileId) + sets activeLabGroup
 * - closes previous active entries for that profile
 * - inserts new entries using provided timeSlots
 */
export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);
    const parsed = ApplySchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const applyFrom = parseISODateUTC(parsed.data.applyFrom);
    const closeDate = new Date(applyFrom);
    closeDate.setUTCDate(closeDate.getUTCDate() - 1);

    // Upsert profile (section)
    const profile = await prisma.timetableProfile.upsert({
      where: { userId_name: { userId, name: parsed.data.profileName } },
      update: {},
      create: { userId, name: parsed.data.profileName, isDefault: false }
    });

    // Make default (uploaded becomes default)
    if (parsed.data.makeDefault) {
      await prisma.timetableProfile.updateMany({ where: { userId }, data: { isDefault: false } });
      await prisma.timetableProfile.update({ where: { id: profile.id }, data: { isDefault: true } });
    }

    // Close existing active entries for this profile
    await prisma.timetableEntry.updateMany({
      where: { userId, profileId: profile.id, validTo: null },
      data: { validTo: closeDate }
    });

    // Update settings: make this profile active + store timeslots + lab group
    await prisma.userSettings.update({
      where: { userId },
      data: {
        activeProfileId: profile.id,
        activeLabGroup: parsed.data.activeLabGroup as any,
        timeSlots: parsed.data.timeSlots,
        countryCode: (await prisma.userSettings.findUnique({ where: { userId } }))?.countryCode ?? "IN"
      }
    });

    // Upsert subjects by course name (e.g. "ICT 101T")
    const uniqueCourses = Array.from(new Set(parsed.data.entries.map(e => e.course.trim())));
    const subjectIdByCourse = new Map<string, string>();

    for (const course of uniqueCourses) {
      const subj = await prisma.subject.upsert({
        where: { userId_name: { userId, name: course } },
        update: {},
        create: { userId, name: course }
      });
      subjectIdByCourse.set(course, subj.id);
    }

    // Insert timetable entries
    const createData = parsed.data.entries.map(e => {
      const slot = parsed.data.timeSlots[e.slotIndex];
      return {
        userId,
        profileId: profile.id,
        subjectId: subjectIdByCourse.get(e.course.trim())!,
        weekday: e.weekday,
        startTime: slot.start,
        endTime: slot.end,
        weight: e.weight,
        location: e.room ?? null,
        labGroup: e.labGroup as any,
        validFrom: applyFrom,
        validTo: null as Date | null
      };
    });

    if (createData.length) await prisma.timetableEntry.createMany({ data: createData });

    return Response.json({ ok: true, profileId: profile.id, created: createData.length });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
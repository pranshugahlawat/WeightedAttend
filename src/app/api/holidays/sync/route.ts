import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/requireUser";
import { fetchPublicHolidays } from "@/lib/nager";
import { z } from "zod";
import { parseISODateUTC } from "@/lib/dates";

const Schema = z.object({
  year: z.number().int().min(2000).max(2100),
  countryCode: z.string().min(2).max(2)
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

    const countryCode = parsed.data.countryCode.toUpperCase();
    const holidays = await fetchPublicHolidays(parsed.data.year, countryCode);

    let count = 0;
    for (const h of holidays) {
      const date = parseISODateUTC(h.date);
      await prisma.holiday.upsert({
        where: { userId_date: { userId, date } },
        update: { name: h.name, source: "NAGER" },
        create: { userId, date, name: h.name, source: "NAGER" }
      });
      count++;
    }

    await prisma.userSettings.update({
      where: { userId },
      data: { countryCode }
    });

    return Response.json({ ok: true, synced: count });
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
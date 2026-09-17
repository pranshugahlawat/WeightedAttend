import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6)
});

const defaultSlots = [
  { label: "9-10", start: "09:00", end: "10:00" },
  { label: "10-11", start: "10:00", end: "11:00" },
  { label: "11-12", start: "11:00", end: "12:00" },
  { label: "12-1", start: "12:00", end: "13:00" },
  { label: "1.30-2.30", start: "13:30", end: "14:30" },
  { label: "2.30-3.30", start: "14:30", end: "15:30" },
  { label: "3.30-4.30", start: "15:30", end: "16:30" },
  { label: "4.30-5.30", start: "16:30", end: "17:30" }
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

  const { email, name, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return Response.json({ error: "Email already exists" }, { status: 409 });

  const passwordHash = await hashPassword(password);

  const now = new Date();
  const year = now.getFullYear();

  await prisma.user.create({
    data: {
      email,
      name: name?.trim() || null,
      passwordHash,
      settings: {
        create: {
          semesterStart: new Date(year, 0, 1),
          semesterEnd: new Date(year, 11, 31),
          targetPercent: 75,
          countryCode: "IN",
          activeProfileId: null,
          activeLabGroup: "A",
          timeSlots: defaultSlots
        }
      }
    }
  });

  return Response.json({ ok: true });
}
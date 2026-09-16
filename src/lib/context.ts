import { prisma } from "@/lib/db";

export type ActiveContext = {
  activeProfileId: string | null;
  activeLabGroup: "A" | "B" | "C" | "D";
  targetPercent: number;
  countryCode: string;
  timeSlots: { label: string; start: string; end: string }[];
};

const fallbackSlots = [
  { label: "9-10", start: "09:00", end: "10:00" },
  { label: "10-11", start: "10:00", end: "11:00" },
  { label: "11-12", start: "11:00", end: "12:00" },
  { label: "12-1", start: "12:00", end: "13:00" },
  { label: "1.30-2.30", start: "13:30", end: "14:30" },
  { label: "2.30-3.30", start: "14:30", end: "15:30" },
  { label: "3.30-4.30", start: "15:30", end: "16:30" },
  { label: "4.30-5.30", start: "16:30", end: "17:30" }
];

export async function getActiveContext(userId: string): Promise<ActiveContext> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  const timeSlots = (settings?.timeSlots as any) ?? fallbackSlots;

  return {
    activeProfileId: settings?.activeProfileId ?? null,
    activeLabGroup: (settings?.activeLabGroup as any) ?? "A",
    targetPercent: settings?.targetPercent ?? 75,
    countryCode: settings?.countryCode ?? "IN",
    timeSlots
  };
}
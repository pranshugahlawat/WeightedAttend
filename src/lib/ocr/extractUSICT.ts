import type { OCRResult } from "./ocr";

export type ExtractedEntry = {
  weekday: number;      // 1=Mon..5=Fri
  slotIndex: number;    // 0..7
  course: string;       // e.g. "ICT 101T", "ICT 101P", "EM 117"
  room: string | null;  // e.g. "NBLT 302"
  labGroup: "A" | "B" | "C" | "D" | null;
  weight: number;       // 2 for P (practical), else 1
};

export type ExtractedTimetable = {
  detectedSection: string | null;
  entries: ExtractedEntry[];
};

export function extractUSICTTimetable(ocr: OCRResult): ExtractedTimetable {
  const { words, imageSize } = ocr;

  // detect section header from top area
  const headerText = words
    .filter(w => w.bbox.y0 < imageSize.height * 0.15)
    .map(w => w.text)
    .join(" ");
  const detectedSection =
    headerText.match(/[A-Z]{2,}(?:_[A-Z0-9]+)*_SEC\d+/)?.[0] ??
    headerText.match(/[A-Z]{2,}(?:_[A-Z0-9]+){1,}/)?.[0] ??
    null;

  const dayTokens = ["Mo", "Tu", "We", "Th", "Fr"];
  const dayCenters = words
    .filter(w => dayTokens.includes(cleanDay(w.text)))
    .map(w => ({ day: cleanDay(w.text), y: cy(w.bbox) }))
    .sort((a, b) => a.y - b.y);

  const dayToWeekday: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5 };
  if (dayCenters.length < 3) return { detectedSection, entries: [] };

  const bands = dayCenters.map((d, i) => {
    const top = d.y - 40;
    const bottom = (dayCenters[i + 1]?.y ?? imageSize.height * 0.92) - 20;
    return { weekday: dayToWeekday[d.day], top, bottom };
  });

  // Grid columns: day label col ~13%, remaining 8 slots equally
  const dayColRight = imageSize.width * 0.13;
  const colW = (imageSize.width - dayColRight) / 8;

  const buckets = new Map<string, string[]>();

  for (const b of bands) {
    const inBand = words.filter(w => {
      const y = cy(w.bbox);
      return y >= b.top && y <= b.bottom;
    });

    for (const w of inBand) {
      const idx = slotIdx(cx(w.bbox), dayColRight, colW);
      if (idx === null) continue;
      const key = `${b.weekday}-${idx}`;
      const arr = buckets.get(key) ?? [];
      arr.push(w.text);
      buckets.set(key, arr);
    }
  }

  const entries: ExtractedEntry[] = [];

  for (const [key, texts] of buckets.entries()) {
    const [weekdayStr, slotStr] = key.split("-");
    const weekday = Number(weekdayStr);
    const slotIndex = Number(slotStr);

    const cellText = texts.join(" ").replace(/\s+/g, " ").trim();
    if (!cellText) continue;

    const room =
      cellText.match(/(NBLT\s*\d+|ECR\s*\d+|DTL\s*\d+|ETL\s*\d+|NBLAB\d+)/)?.[1]?.replace(/\s+/g, " ") ??
      null;

    const courseMatches = cellText.match(/([A-Z]{2,6})\s*(\d{3})([A-Z])?/g) ?? [];
    const courses = Array.from(new Set(courseMatches.map(normalizeCourse)));

    // group tokens like _GPA/_GPB/_GPC/_GPD -> A/B/C/D
    const gp = cellText.match(/_GP([A-D])\b/g)?.map(s => s.replace("_GP", "")) ?? [];
    const groups = Array.from(new Set(gp)) as ("A" | "B" | "C" | "D")[];

    if (groups.length > 0) {
      for (const g of groups) {
        for (const c of courses) {
          if (!c) continue;
          entries.push({
            weekday,
            slotIndex,
            course: c,
            room,
            labGroup: g,
            weight: c.endsWith("P") ? 2 : 1
          });
        }
      }
    } else {
      for (const c of courses) {
        if (!c) continue;
        entries.push({
          weekday,
          slotIndex,
          course: c,
          room,
          labGroup: null,
          weight: c.endsWith("P") ? 2 : 1
        });
      }
    }
  }

  // de-dup
  const seen = new Set<string>();
  const dedup = entries.filter(e => {
    const k = `${e.weekday}-${e.slotIndex}-${e.course}-${e.labGroup ?? "ALL"}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { detectedSection, entries: dedup };
}

function slotIdx(x: number, dayColRight: number, colW: number) {
  if (x < dayColRight) return null;
  const idx = Math.floor((x - dayColRight) / colW);
  if (idx < 0 || idx > 7) return null;
  return idx;
}

function cleanDay(s: string) {
  return s.replace(/[^\w]/g, "");
}
function cx(b: any) { return (b.x0 + b.x1) / 2; }
function cy(b: any) { return (b.y0 + b.y1) / 2; }

function normalizeCourse(s: string) {
  const m = s.replace(/\s+/g, " ").trim().match(/^([A-Z]{2,6})\s*(\d{3})\s*([A-Z])?$/);
  if (!m) return s.replace(/\s+/g, " ").trim();
  return `${m[1]} ${m[2]}${m[3] ?? ""}`.trim();
}
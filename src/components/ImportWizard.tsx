"use client";

import { useMemo, useState } from "react";
import { pdfPageToImage } from "@/lib/ocr/pdfToImages";
import { ocrImageDetailed } from "@/lib/ocr/ocr";
import { extractUSICTTimetable } from "@/lib/ocr/extractUSICT";

type LabGroup = "A" | "B" | "C" | "D";

export default function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);

  // Defaults you requested:
  const [pageNo, setPageNo] = useState(1);              // CSE_I_SEC1 usually page 1
  const [labGroup, setLabGroup] = useState<LabGroup>("A"); // Group A by default

  const [applyFrom, setApplyFrom] = useState(() => new Date().toISOString().slice(0, 10));

  const [busy, setBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<{ section: string | null; count: number } | null>(null);
  const [payload, setPayload] = useState<any>(null);

  const [timeSlots, setTimeSlots] = useState(() => ([
    { label: "9-10", start: "09:00", end: "10:00" },
    { label: "10-11", start: "10:00", end: "11:00" },
    { label: "11-12", start: "11:00", end: "12:00" },
    { label: "12-1", start: "12:00", end: "13:00" },
    { label: "1.30-2.30", start: "13:30", end: "14:30" },
    { label: "2.30-3.30", start: "14:30", end: "15:30" },
    { label: "3.30-4.30", start: "15:30", end: "16:30" },
    { label: "4.30-5.30", start: "16:30", end: "17:30" }
  ]));

  const fileLabel = useMemo(() => {
    if (!file) return "No file selected";
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file]);

  async function useSample() {
    setError(null);
    try {
      const res = await fetch("/usict-timetable.pdf", { cache: "no-store" });
      if (!res.ok) throw new Error("Sample PDF not found at /public/usict-timetable.pdf");
      const blob = await res.blob();
      const f = new File([blob], "usict-timetable.pdf", { type: "application/pdf" });
      setFile(f);
      setPageNo(1);
      setLabGroup("A");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load sample PDF");
    }
  }

  async function runOCR() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    setPayload(null);

    try {
      let img: string;
      if (file.type === "application/pdf") {
        img = await pdfPageToImage(file, pageNo);
      } else {
        img = await fileToDataUrl(file);
      }

      const ocr = await ocrImageDetailed(img);
      const extracted = extractUSICTTimetable(ocr);

      const profileName = extracted.detectedSection ?? "CSE_I_SEC1";

      const nextPayload = {
        profileName,
        makeDefault: true,          // uploaded/imported becomes default
        applyFrom,
        activeLabGroup: labGroup,   // also sets active lab group
        timeSlots,
        entries: extracted.entries
      };

      setPreview({ section: profileName, count: extracted.entries.length });
      setPayload(nextPayload);
    } catch (e: any) {
      setError(e?.message ?? "OCR failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyImport() {
    if (!payload) return;
    setApplyBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/timetable", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const msg = ct.includes("application/json") ? (await res.json())?.error : await res.text();
        throw new Error(msg || "Failed to apply timetable");
      }

      alert("Imported timetable applied and set as default + active.");
      location.href = "/timetable";
    } catch (e: any) {
      setError(e?.message ?? "Apply failed");
    } finally {
      setApplyBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">USICT Timetable Import (OCR)</div>
        <div className="text-xs text-neutral-500 mt-1">
          Default: <b>Page 1 (CSE_I_SEC1)</b> + <b>Group A</b>. You can change them anytime.
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-4">
          <div className="md:col-span-2">
            <div className="text-xs text-neutral-500">PDF/Image</div>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs text-neutral-500 mt-1">{fileLabel}</div>

            <button
              type="button"
              onClick={useSample}
              className="mt-2 px-3 py-2 rounded-md border text-sm hover:bg-neutral-50"
            >
              Use sample timetable (preloaded)
            </button>
          </div>

          <div>
            <div className="text-xs text-neutral-500">PDF page no.</div>
            <input
              className="w-full border rounded-md p-2"
              type="number"
              min={1}
              value={pageNo}
              onChange={(e) => setPageNo(Number(e.target.value))}
            />
          </div>

          <div>
            <div className="text-xs text-neutral-500">Lab group</div>
            <select
              className="w-full border rounded-md p-2"
              value={labGroup}
              onChange={(e) => setLabGroup(e.target.value as LabGroup)}
            >
              <option value="A">A (GPA)</option>
              <option value="B">B (GPB)</option>
              <option value="C">C (GPC)</option>
              <option value="D">D (GPD)</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div>
            <div className="text-xs text-neutral-500">Apply from</div>
            <input
              className="w-full border rounded-md p-2"
              type="date"
              value={applyFrom}
              onChange={(e) => setApplyFrom(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex items-end gap-2">
            <button
              onClick={runOCR}
              disabled={!file || busy}
              className="px-3 py-2 rounded-md bg-black text-white text-sm disabled:opacity-60"
            >
              {busy ? "Running OCR…" : "Run OCR"}
            </button>

            {payload ? (
              <button
                onClick={applyImport}
                disabled={applyBusy}
                className="px-3 py-2 rounded-md border text-sm hover:bg-neutral-50 disabled:opacity-60"
              >
                {applyBusy ? "Applying…" : "Apply & Set Default"}
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-3 text-sm text-red-700">{error}</div>
        ) : null}
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Time slots</div>
        <div className="text-xs text-neutral-500 mt-1">Used to map 8 columns to times.</div>

        <div className="mt-3 grid md:grid-cols-4 gap-2">
          {timeSlots.map((s, i) => (
            <div key={i} className="border rounded-md p-2">
              <div className="text-xs font-medium">{s.label}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  className="border rounded-md p-1 text-sm"
                  value={s.start}
                  onChange={(e) => {
                    const next = [...timeSlots];
                    next[i] = { ...next[i], start: e.target.value };
                    setTimeSlots(next);
                  }}
                />
                <input
                  className="border rounded-md p-1 text-sm"
                  value={s.end}
                  onChange={(e) => {
                    const next = [...timeSlots];
                    next[i] = { ...next[i], end: e.target.value };
                    setTimeSlots(next);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview ? (
        <div className="border rounded-lg p-4 bg-white">
          <div className="font-semibold">Preview</div>
          <div className="text-sm mt-2">
            Detected section: <b>{preview.section}</b>
          </div>
          <div className="text-sm">
            Extracted entries: <b>{preview.count}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
"use client";

import { useState } from "react";
import { pdfPageToImage } from "@/lib/ocr/pdfToImages";
import { ocrImageDetailed } from "@/lib/ocr/ocr";
import { extractUSICTTimetable } from "@/lib/ocr/extractUSICT";

export default function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [applyFrom, setApplyFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [labGroup, setLabGroup] = useState<"A" | "B" | "C" | "D">("A");

  const [busy, setBusy] = useState(false);
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

  async function run() {
    if (!file) return;
    setBusy(true);
    setPreview(null);
    setPayload(null);

    let img: string;
    if (file.type === "application/pdf") img = await pdfPageToImage(file, pageNo);
    else img = await fileToDataUrl(file);

    const ocr = await ocrImageDetailed(img);
    const extracted = extractUSICTTimetable(ocr);

    const profileName = extracted.detectedSection ?? "Imported_Section";

    const nextPayload = {
      profileName,
      makeDefault: true,           // uploaded one becomes default
      applyFrom,
      activeLabGroup: labGroup,    // also sets active lab group
      timeSlots,
      entries: extracted.entries
    };

    setPreview({ section: profileName, count: extracted.entries.length });
    setPayload(nextPayload);
    setBusy(false);
  }

  async function apply() {
    if (!payload) return;
    const res = await fetch("/api/timetable", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to apply timetable");
      return;
    }
    alert("Imported timetable applied and set as default + active.");
    location.href = "/timetable";
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">USICT Timetable Import (OCR)</div>
        <div className="text-xs text-neutral-500 mt-1">
          Choose the page for your section (e.g. CSE_I_SEC1 is usually page 1 in your PDF).
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-4">
          <div>
            <div className="text-xs text-neutral-500">PDF/Image</div>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <div>
            <div className="text-xs text-neutral-500">PDF page no.</div>
            <input className="w-full border rounded-md p-2" type="number" min={1} value={pageNo} onChange={(e) => setPageNo(Number(e.target.value))} />
          </div>

          <div>
            <div className="text-xs text-neutral-500">Apply from</div>
            <input className="w-full border rounded-md p-2" type="date" value={applyFrom} onChange={(e) => setApplyFrom(e.target.value)} />
          </div>

          <div>
            <div className="text-xs text-neutral-500">Your lab group</div>
            <select className="w-full border rounded-md p-2" value={labGroup} onChange={(e) => setLabGroup(e.target.value as any)}>
              <option value="A">A (GPA)</option>
              <option value="B">B (GPB)</option>
              <option value="C">C (GPC)</option>
              <option value="D">D (GPD)</option>
            </select>
          </div>
        </div>

        <button
          onClick={run}
          disabled={!file || busy}
          className="mt-4 px-3 py-2 rounded-md bg-black text-white text-sm disabled:opacity-60"
        >
          {busy ? "Running OCR…" : "Run OCR"}
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Time slots</div>
        <div className="text-xs text-neutral-500 mt-1">Used to map 8 columns to times.</div>

        <div className="mt-3 grid md:grid-cols-4 gap-2">
          {timeSlots.map((s, i) => (
            <div key={i} className="border rounded-md p-2">
              <div className="text-xs font-medium">{s.label}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input className="border rounded-md p-1 text-sm" value={s.start} onChange={(e) => {
                  const next = [...timeSlots]; next[i] = { ...next[i], start: e.target.value }; setTimeSlots(next);
                }} />
                <input className="border rounded-md p-1 text-sm" value={s.end} onChange={(e) => {
                  const next = [...timeSlots]; next[i] = { ...next[i], end: e.target.value }; setTimeSlots(next);
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview ? (
        <div className="border rounded-lg p-4 bg-white">
          <div className="font-semibold">Preview</div>
          <div className="text-sm mt-2">Detected section: <b>{preview.section}</b></div>
          <div className="text-sm">Extracted entries: <b>{preview.count}</b></div>

          <button onClick={apply} className="mt-4 px-3 py-2 rounded-md bg-black text-white text-sm">
            Apply & Set Default
          </button>
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
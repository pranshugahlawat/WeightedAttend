"use client";

import { useEffect, useMemo, useState } from "react";

type Subject = { id: string; name: string; color: string | null };
type Entry = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  weight: number;
  location: string | null;
  labGroup: "A" | "B" | "C" | "D" | null;
  subject: Subject;
  validFrom: string;
  validTo: string | null;
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TimetableEditor() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ctx, setCtx] = useState<{ activeProfileId: string | null; activeLabGroup: "A"|"B"|"C"|"D" } | null>(null);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    subjectId: "",
    weekday: 1,
    startTime: "09:00",
    endTime: "10:00",
    weight: 1,
    location: "",
    labGroup: "" as "" | "A" | "B" | "C" | "D"
  });

  async function load() {
    setLoading(true);
    const [s, t, c] = await Promise.all([
      fetch("/api/subjects", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/timetable", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/settings", { cache: "no-store" }).then((r) => r.json())
    ]);

    setSubjects(s.subjects ?? []);
    setEntries(t.entries ?? []);
    setCtx(c.settings ? { activeProfileId: c.settings.activeProfileId, activeLabGroup: c.settings.activeLabGroup } : null);

    if (!form.subjectId && (s.subjects?.[0]?.id)) setForm((f) => ({ ...f, subjectId: s.subjects[0].id }));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const activeEntries = useMemo(() => entries.filter((e) => e.validTo === null), [entries]);

  async function addEntry() {
    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        labGroup: form.labGroup === "" ? null : form.labGroup,
        location: form.location?.trim() || null
      })
    });
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to add");
      return;
    }
    load();
  }

  async function removeEntry(id: string) {
    const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to delete");
      return;
    }
    load();
  }

  if (loading) return <div>Loading...</div>;

  if (!ctx?.activeProfileId) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">No active section selected</div>
        <div className="text-sm text-neutral-600 mt-1">
          Import your timetable from <b>Import (OCR)</b> to create a section profile, then select it from the top bar.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Add class (manual override)</div>
        <div className="text-xs text-neutral-500 mt-1">
          Optional: assign a Lab Group (A/B/C/D) if it should appear only for that group.
        </div>

        <div className="grid md:grid-cols-7 gap-2 mt-3">
          <select className="border rounded-md p-2" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select className="border rounded-md p-2" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
            {dayLabels.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>

          <input className="border rounded-md p-2" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <input className="border rounded-md p-2" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />

          <input type="number" min={1} max={5} className="border rounded-md p-2"
            value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />

          <input className="border rounded-md p-2" placeholder="Location"
            value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />

          <select className="border rounded-md p-2" value={form.labGroup} onChange={(e) => setForm({ ...form, labGroup: e.target.value as any })}>
            <option value="">All groups (theory)</option>
            <option value="A">Only A (GPA)</option>
            <option value="B">Only B (GPB)</option>
            <option value="C">Only C (GPC)</option>
            <option value="D">Only D (GPD)</option>
          </select>
        </div>

        <button onClick={addEntry} className="mt-3 px-3 py-2 rounded-md bg-black text-white text-sm">
          Add
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Active timetable</div>
        <div className="mt-3 overflow-auto">
          <table className="min-w-[1000px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Weight</th>
                <th>Room</th>
                <th>Group</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {activeEntries.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="py-2">{dayLabels[e.weekday]}</td>
                  <td>{e.startTime} - {e.endTime}</td>
                  <td className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.subject.color ?? "#111827" }} />
                      {e.subject.name}
                    </span>
                  </td>
                  <td>{e.weight}</td>
                  <td>{e.location ?? "-"}</td>
                  <td>{e.labGroup ?? "ALL"}</td>
                  <td className="text-right">
                    <button onClick={() => removeEntry(e.id)} className="text-red-700 hover:underline">
                      delete
                    </button>
                  </td>
                </tr>
              ))}

              {activeEntries.length === 0 ? (
                <tr><td className="py-3 text-neutral-500" colSpan={7}>No active timetable entries.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-neutral-500 mt-3">
          Entries are versioned by date range. Importing a new timetable closes previous ones automatically.
        </div>
      </div>
    </div>
  );
}
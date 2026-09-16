"use client";

import { useEffect, useMemo, useState } from "react";

type Session = {
  id: string;
  status: "PRESENT" | "ABSENT" | "CANCELLED";
  timetableEntry: {
    weight: number;
    startTime: string;
    endTime: string;
    location: string | null;
    labGroup: "A"|"B"|"C"|"D"|null;
    subject: { name: string; color: string | null };
  };
};

export default function AttendancePanel() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holiday, setHoliday] = useState<{ name: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  async function ensureAndLoad() {
    setLoading(true);
    const res = await fetch(`/api/sessions?date=${date}`, { method: "PUT" });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      alert(data?.error ?? "Failed to load sessions");
      return;
    }
    setHoliday(data.holiday ?? null);
    setSessions(data.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => { ensureAndLoad(); }, [date]);

  async function mark(id: string, status: Session["status"]) {
    const res = await fetch(`/api/sessions/${id}/mark`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to mark");
      return;
    }
    ensureAndLoad();
  }

  const summary = useMemo(() => {
    let presentW = 0, conductedW = 0;
    for (const s of sessions) {
      if (s.status === "CANCELLED") continue;
      const w = s.timetableEntry.weight;
      if (s.status === "PRESENT") presentW += w;
      if (s.status === "PRESENT" || s.status === "ABSENT") conductedW += w;
    }
    const percent = conductedW ? Math.round((presentW / conductedW) * 1000) / 10 : 0;
    return { presentW, conductedW, percent };
  }, [sessions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div>
          <div className="text-xs text-neutral-500">Pick date</div>
          <input type="date" className="border rounded-md p-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="border rounded-lg p-3 flex-1 bg-white">
          <div className="text-xs text-neutral-500">Day summary (weighted)</div>
          <div className="font-semibold">{summary.percent}%</div>
          <div className="text-xs text-neutral-500">PresentW: {summary.presentW} / ConductedW: {summary.conductedW}</div>
        </div>
      </div>

      {holiday ? (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4">
          <div className="font-semibold">Holiday</div>
          <div className="text-sm text-neutral-700">{holiday.name}</div>
          <div className="text-xs text-neutral-500 mt-1">Attendance marking is disabled for holidays.</div>
        </div>
      ) : null}

      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Classes</div>
        {loading ? <div className="mt-3">Loading...</div> : null}

        <div className="mt-3 space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="border rounded-md p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.timetableEntry.subject.color ?? "#111827" }} />
                  {s.timetableEntry.subject.name}
                  <span className="text-xs text-neutral-500">
                    ({s.timetableEntry.startTime}-{s.timetableEntry.endTime}, w={s.timetableEntry.weight})
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  Room: {s.timetableEntry.location ?? "-"} | Group: {s.timetableEntry.labGroup ?? "ALL"} | Status: {s.status}
                </div>
              </div>

              <div className="flex gap-2">
                <button disabled={!!holiday} onClick={() => mark(s.id, "PRESENT")} className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50">
                  Present
                </button>
                <button disabled={!!holiday} onClick={() => mark(s.id, "ABSENT")} className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50">
                  Absent
                </button>
                <button disabled={!!holiday} onClick={() => mark(s.id, "CANCELLED")} className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
            </div>
          ))}

          {!holiday && sessions.length === 0 ? (
            <div className="text-sm text-neutral-500">No classes for this date.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
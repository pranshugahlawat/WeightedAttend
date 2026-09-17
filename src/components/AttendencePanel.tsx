"use client";

import { useEffect, useMemo, useState } from "react";

type Session = {
  id: string;
  status: "PRESENT" | "ABSENT" | "CANCELLED";
  lockedAt: string | null; // ✅ required for locking
  timetableEntry: {
    weight: number;
    startTime: string;
    endTime: string;
    location: string | null;
    labGroup: "A" | "B" | "C" | "D" | null;
    subject: { name: string; color: string | null };
  };
};

export default function AttendancePanel() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holiday, setHoliday] = useState<{ name: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function ensureAndLoad() {
    setLoading(true);
    setMsg(null);

    const res = await fetch(`/api/sessions?date=${date}`, { method: "PUT" });
    const data = await safeJson(res);

    if (!res.ok) {
      setLoading(false);
      setMsg(data?.error ?? "Failed to load sessions");
      return;
    }

    setHoliday(data.holiday ?? null);
    setSessions(data.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    ensureAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function mark(id: string, status: Session["status"]) {
    setMsg(null);

    const res = await fetch(`/api/sessions/${id}/mark`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await safeJson(res);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to mark attendance");
      return;
    }

    // Optimistic update: lock immediately in UI
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status, lockedAt: new Date().toISOString() }
          : s
      )
    );
  }

  // ✅ Summary uses only locked sessions so unmarked doesn't affect stats
  const summary = useMemo(() => {
    let presentW = 0;
    let conductedW = 0;

    for (const s of sessions) {
      if (!s.lockedAt) continue; // ignore unmarked
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
          <input
            type="date"
            className="border rounded-md p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="border rounded-lg p-3 flex-1 bg-white">
          <div className="text-xs text-neutral-500">Day summary (weighted, locked only)</div>
          <div className="font-semibold">{summary.percent}%</div>
          <div className="text-xs text-neutral-500">
            PresentW: {summary.presentW} / ConductedW: {summary.conductedW}
          </div>
        </div>
      </div>

      {msg ? (
        <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm text-red-800">
          {msg}
        </div>
      ) : null}

      {holiday ? (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4">
          <div className="font-semibold">Holiday</div>
          <div className="text-sm text-neutral-700">{holiday.name}</div>
          <div className="text-xs text-neutral-500 mt-1">
            Attendance marking is disabled for holidays.
          </div>
        </div>
      ) : null}

      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Classes</div>
        {loading ? <div className="mt-3">Loading...</div> : null}

        <div className="mt-3 space-y-2">
          {sessions.map((s) => {
            const locked = !!s.lockedAt;
            const displayStatus = locked ? s.status : "UNMARKED";

            return (
              <div
                key={s.id}
                className={`border rounded-md p-3 flex items-center justify-between gap-3 ${
                  locked ? "opacity-90" : ""
                }`}
              >
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: s.timetableEntry.subject.color ?? "#111827" }}
                    />
                    {s.timetableEntry.subject.name}
                    <span className="text-xs text-neutral-500">
                      ({s.timetableEntry.startTime}-{s.timetableEntry.endTime}, w={s.timetableEntry.weight})
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500">
                    Room: {s.timetableEntry.location ?? "-"} | Group: {s.timetableEntry.labGroup ?? "ALL"} | Status:{" "}
                    <b>{displayStatus}</b> {locked ? <span className="text-neutral-400">(locked)</span> : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={!!holiday || locked}
                    onClick={() => mark(s.id, "PRESENT")}
                    className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Present
                  </button>
                  <button
                    disabled={!!holiday || locked}
                    onClick={() => mark(s.id, "ABSENT")}
                    className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Absent
                  </button>
                  <button
                    disabled={!!holiday || locked}
                    onClick={() => mark(s.id, "CANCELLED")}
                    className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}

          {!holiday && sessions.length === 0 ? (
            <div className="text-sm text-neutral-500">No classes for this date.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }
  const text = await res.text().catch(() => "");
  return { error: text || `HTTP ${res.status}` };
}
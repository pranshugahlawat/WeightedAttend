"use client";

import { useEffect, useState } from "react";

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [targetPercent, setTargetPercent] = useState(75);
  const [countryCode, setCountryCode] = useState("IN");
  const [year, setYear] = useState(new Date().getFullYear());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings/full", { cache: "no-store" });
      const data = await res.json();
      setTargetPercent(data.settings?.targetPercent ?? 75);
      setCountryCode(data.settings?.countryCode ?? "IN");
      setYear(new Date().getFullYear());
      setLoading(false);
    })();
  }, []);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/settings/full", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetPercent, countryCode })
    });
    setBusy(false);
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed");
      return;
    }
    alert("Saved.");
  }

  async function syncHolidays() {
    setBusy(true);
    const res = await fetch("/api/holidays/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ year, countryCode })
    });
    setBusy(false);
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to sync holidays");
      return;
    }
    alert("Holiday sync complete.");
  }

  if (loading) return <div className="border rounded-lg p-4 bg-white">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Attendance target</div>
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div>
            <div className="text-xs text-neutral-500">Target %</div>
            <input type="number" min={1} max={100} className="w-full border rounded-md p-2"
              value={targetPercent} onChange={(e) => setTargetPercent(Number(e.target.value))} />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button disabled={busy} onClick={save}
              className="px-3 py-2 rounded-md bg-black text-white text-sm disabled:opacity-60">
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <div className="font-semibold">Holiday sync (Nager.Date)</div>
        <div className="text-xs text-neutral-500 mt-1">
          Sync public holidays to disable attendance marking on those dates.
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div>
            <div className="text-xs text-neutral-500">Country code</div>
            <input className="w-full border rounded-md p-2" value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))} />
          </div>
          <div>
            <div className="text-xs text-neutral-500">Year</div>
            <input type="number" className="w-full border rounded-md p-2" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <button disabled={busy} onClick={syncHolidays}
              className="px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50 text-sm disabled:opacity-60">
              Sync holidays
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
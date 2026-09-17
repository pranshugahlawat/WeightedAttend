"use client";

import { useEffect, useState } from "react";

type Profile = { id: string; name: string; isDefault: boolean };
type Settings = { activeProfileId: string | null; activeLabGroup: "A" | "B" | "C" | "D" };

export default function ContextSwitcher() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [p, s] = await Promise.all([
      fetch("/api/profiles", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/settings", { cache: "no-store" }).then((r) => r.json())
    ]);
    setProfiles(p.profiles ?? []);
    setSettings(s.settings ?? null);
  }

  useEffect(() => { load(); }, []);

  async function update(next: Partial<Settings>) {
    if (!settings) return;
    setBusy(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...settings, ...next })
    });
    setBusy(false);
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed");
      return;
    }
    await load();
    location.reload();
  }

  if (!settings) return null;

  const hasProfiles = profiles.length > 0;
  const hasActive = !!settings.activeProfileId;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        className="border rounded-md p-2 text-sm"
        value={settings.activeProfileId ?? ""}
        onChange={(e) => update({ activeProfileId: e.target.value || null })}
        disabled={busy}
      >
        <option value="">{hasProfiles ? "Select section…" : "No sections (Import timetable)"}</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.isDefault ? " (default)" : ""}
          </option>
        ))}
      </select>

      <select
        className="border rounded-md p-2 text-sm"
        value={settings.activeLabGroup}
        onChange={(e) => update({ activeLabGroup: e.target.value as any })}
        disabled={busy || !hasActive}
        title={!hasActive ? "Select a section first" : ""}
      >
        <option value="A">Lab Group A (GPA)</option>
        <option value="B">Lab Group B (GPB)</option>
        <option value="C">Lab Group C (GPC)</option>
        <option value="D">Lab Group D (GPD)</option>
      </select>

      {!hasProfiles ? (
        <a className="text-sm text-blue-700 hover:underline" href="/import">
          Import now
        </a>
      ) : null}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
};

type Settings = {
  activeProfileId: string | null;
  activeLabGroup: "A" | "B" | "C" | "D";
};

export default function ProfileManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [p, s] = await Promise.all([
      fetch("/api/profiles", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/settings", { cache: "no-store" }).then((r) => r.json())
    ]);
    setProfiles(p.profiles ?? []);
    setSettings(s.settings ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const active = useMemo(() => {
    if (!settings?.activeProfileId) return null;
    return profiles.find((x) => x.id === settings.activeProfileId) ?? null;
  }, [profiles, settings]);

  async function setActive(profileId: string) {
    if (!settings) return;
    setBusyId(profileId);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...settings, activeProfileId: profileId })
    });
    setBusyId(null);
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to set active");
      return;
    }
    await load();
  }

  async function setDefault(profileId: string) {
    setBusyId(profileId);
    const res = await fetch(`/api/profiles/${profileId}/default`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to set default");
      return;
    }
    await load();
  }

  async function rename(profileId: string, currentName: string) {
    const next = prompt("Rename profile:", currentName);
    if (!next || !next.trim()) return;

    setBusyId(profileId);
    const res = await fetch(`/api/profiles/${profileId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: next.trim() })
    });
    setBusyId(null);

    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to rename");
      return;
    }
    await load();
  }

  async function remove(profileId: string, name: string) {
    if (!confirm(`Delete profile "${name}"?\nThis will delete its timetable entries and sessions.`)) return;

    setBusyId(profileId);
    const res = await fetch(`/api/profiles/${profileId}`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to delete");
      return;
    }
    await load();
  }

  if (loading) return <div className="border rounded-lg p-4 bg-white">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <div className="text-sm">
          Active profile: <b>{active?.name ?? "None"}</b>{" "}
          <span className="text-neutral-500">
            (Lab Group {settings?.activeLabGroup ?? "A"})
          </span>
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          Tip: Import a timetable to create profiles automatically from section headers in the PDF.
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-white overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Profile</th>
              <th>Default</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {profiles.map((p) => {
              const isActive = settings?.activeProfileId === p.id;
              const disabled = busyId === p.id;

              return (
                <tr key={p.id} className="border-b">
                  <td className="py-2">
                    <div className="font-medium">
                      {p.name} {isActive ? <span className="text-xs text-green-700">(active)</span> : null}
                    </div>
                    <div className="text-xs text-neutral-500">{p.id}</div>
                  </td>

                  <td>{p.isDefault ? "Yes" : "No"}</td>

                  <td className="text-xs text-neutral-600">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>

                  <td className="flex flex-wrap gap-2 py-2">
                    <button
                      disabled={disabled}
                      onClick={() => setActive(p.id)}
                      className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50 disabled:opacity-60"
                    >
                      Set active
                    </button>

                    <button
                      disabled={disabled}
                      onClick={() => setDefault(p.id)}
                      className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50 disabled:opacity-60"
                    >
                      Set default
                    </button>

                    <button
                      disabled={disabled}
                      onClick={() => rename(p.id, p.name)}
                      className="px-2 py-1 text-xs rounded-md border hover:bg-neutral-50 disabled:opacity-60"
                    >
                      Rename
                    </button>

                    <button
                      disabled={disabled}
                      onClick={() => remove(p.id, p.name)}
                      className="px-2 py-1 text-xs rounded-md border text-red-700 hover:bg-neutral-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-neutral-500">
                  No profiles yet. Go to Import (OCR) and apply your timetable.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";

export default function SubjectDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#111827");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, code, color })
    });
    setBusy(false);

    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed");
      return;
    }
    setOpen(false);
    setName("");
    setCode("");
    onDone();
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="px-3 py-2 rounded-md bg-black text-white text-sm">
        + Add Subject
      </button>

      {open ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-neutral-200 p-4">
            <div className="font-semibold">New Subject</div>
            <div className="mt-3 space-y-2">
              <input className="w-full border rounded-md p-2" placeholder="Name (e.g., ICT 101T)" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="w-full border rounded-md p-2" placeholder="Code (optional)" value={code} onChange={(e) => setCode(e.target.value)} />
              <label className="text-sm flex items-center gap-2">
                Color:
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 text-sm border rounded-md" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="px-3 py-2 text-sm rounded-md bg-black text-white disabled:opacity-60"
                disabled={busy || !name.trim()}
                onClick={create}
              >
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
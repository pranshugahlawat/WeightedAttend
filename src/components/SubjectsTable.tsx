"use client";

import { useEffect, useState } from "react";

type Subject = {
  id: string;
  name: string;
  color: string | null;
};

function SubjectStats({ subjectId }: { subjectId: string }) {
  const [txt, setTxt] = useState("—");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/stats/subject/${subjectId}`, { cache: "no-store" });
      if (!res.ok) return setTxt("—");
      const d = await res.json();
      const pct = Number(d.percent ?? 0).toFixed(1);
      setTxt(`${pct}% (P${d.presentW ?? 0}/C${d.conductedW ?? 0})`);
    })();
  }, [subjectId]);

  return <span className="text-xs text-neutral-700">{txt}</span>;
}

export default function SubjectsTable({ subjects }: { subjects: Subject[] }) {
  const deleteSubject = async (id: string) => {
    if (!confirm("Delete subject?")) return;
    const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed to delete");
      return;
    }
    location.reload();
  };

  return (
    <div className="border rounded-lg p-4 bg-white overflow-auto">
      <table className="min-w-[900px] w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th>
            <th>Color</th>
            <th>Stats</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="py-2 font-medium">{s.name}</td>
              <td>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: s.color ?? "#111827" }} />
                  <span className="text-xs text-neutral-500">{s.color ?? "#111827"}</span>
                </span>
              </td>
              <td>
                <SubjectStats subjectId={s.id} />
              </td>
              <td className="text-right">
                <button className="text-red-700 hover:underline" onClick={() => deleteSubject(s.id)}>
                  delete
                </button>
              </td>
            </tr>
          ))}

          {subjects.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-3 text-neutral-500">
                No subjects yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
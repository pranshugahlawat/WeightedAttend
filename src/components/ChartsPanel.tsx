"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ChartsPanel() {
  const [series, setSeries] = useState<{ date: string; percent: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/stats/overall?seriesDays=45", { cache: "no-store" });
      const data = await res.json();
      setSeries(data.series ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="font-semibold">Attendance Graph (Bonus)</div>
      <div className="text-xs text-neutral-500 mt-1">Daily weighted attendance trend</div>

      {loading ? <div className="mt-4">Loading chart…</div> : null}

      <div className="h-64 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="percent" stroke="#111827" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
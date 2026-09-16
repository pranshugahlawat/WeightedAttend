"use client";

import { useEffect, useMemo, useState } from "react";

export default function TargetCalculator() {
  const [loading, setLoading] = useState(true);
  const [presentW, setPresentW] = useState(0);
  const [conductedW, setConductedW] = useState(0);
  const [target, setTarget] = useState(75);
  const [nextClasses, setNextClasses] = useState(10);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/stats/overall", { cache: "no-store" });
      const data = await res.json();
      setPresentW(data.presentW ?? 0);
      setConductedW(data.conductedW ?? 0);
      setTarget(data.targetPercent ?? 75);
      setLoading(false);
    })();
  }, []);

  const computed = useMemo(() => {
    const t = target / 100;
    const P = presentW;
    const C = conductedW;

    // can miss: P/(C+m) >= t -> m <= P/t - C
    const canMiss = Math.floor(P / t - C);

    // must attend in next N: (P+x)/(C+N) >= t -> x >= t(C+N) - P
    const mustAttend = Math.max(0, Math.ceil(t * (C + nextClasses) - P));

    const currentPercent = C === 0 ? 0 : Math.round((P / C) * 1000) / 10;
    return { canMiss: Math.max(0, canMiss), mustAttend, currentPercent };
  }, [target, presentW, conductedW, nextClasses]);

  if (loading) return <div className="border rounded-lg p-4 bg-white">Loading target calculator…</div>;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="font-semibold">Target Calculator (Bonus)</div>
      <div className="text-xs text-neutral-500 mt-1">
        Weighted: PresentW={presentW}, ConductedW={conductedW}, Current={computed.currentPercent}%
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <div>
          <div className="text-xs text-neutral-500">Target %</div>
          <input type="number" min={1} max={100} className="w-full border rounded-md p-2" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </div>

        <div>
          <div className="text-xs text-neutral-500">Assume next N classes</div>
          <input type="number" min={1} className="w-full border rounded-md p-2" value={nextClasses} onChange={(e) => setNextClasses(Number(e.target.value))} />
        </div>

        <div className="border rounded-md p-3">
          <div className="text-xs text-neutral-500">Result</div>
          <div className="text-sm mt-1">
            Can miss: <b>{computed.canMiss}</b> more classes and stay ≥ target
          </div>
          <div className="text-sm mt-1">
            To reach target in next {nextClasses}: must attend at least <b>{computed.mustAttend}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
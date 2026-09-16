import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import TargetCalculator from "@/components/TargetCalculator";
import ChartsPanel from "@/components/ChartsPanel";
import { requireUserId } from "@/lib/requireUser";
import { computeOverallStats } from "@/lib/stats";
import { getActiveContext } from "@/lib/context";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const ctx = await getActiveContext(userId);
  const overall = await computeOverallStats(userId);

  const activeProfile = ctx.activeProfileId
    ? await prisma.timetableProfile.findUnique({ where: { id: ctx.activeProfileId } })
    : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="text-2xl font-semibold">Dashboard</div>
          <div className="text-sm text-neutral-500">
            Active: <b>{activeProfile?.name ?? "No section"}</b> | Lab Group: <b>{ctx.activeLabGroup}</b>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <StatCard
            title="Overall attendance (weighted)"
            value={`${overall.percent.toFixed(1)}%`}
            subtitle={`PresentW ${overall.presentW} / ConductedW ${overall.conductedW}`}
          />
          <StatCard title="Target %" value={`${ctx.targetPercent}%`} subtitle="Used in Target Calculator" />
          <StatCard title="Country" value={ctx.countryCode} subtitle="Used for holiday sync (Nager.Date)" />
        </div>

        <TargetCalculator />
        <ChartsPanel />
      </div>
    </AppShell>
  );
}
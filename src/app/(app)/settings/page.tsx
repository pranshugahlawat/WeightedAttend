import AppShell from "@/components/AppShell";
import SettingsClient from "@/components/SettingsClient";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">Settings</div>
          <div className="text-sm text-neutral-500">Target %, country, holiday sync, and semester dates.</div>
        </div>
        <SettingsClient />
      </div>
    </AppShell>
  );
}
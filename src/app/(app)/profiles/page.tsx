import AppShell from "@/components/AppShell";
import ProfileManager from "@/components/ProfileManager";

export default function ProfilesPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">Profiles</div>
          <div className="text-sm text-neutral-500">
            Manage imported sections (e.g. CSE_I_SEC1) and choose which one is active/default.
          </div>
        </div>
        <ProfileManager />
      </div>
    </AppShell>
  );
}
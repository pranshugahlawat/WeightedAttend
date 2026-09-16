import AppShell from "@/components/AppShell";
import AttendancePanel from "@/components/AttendencePanel";

export default function AttendancePage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">Attendance</div>
          <div className="text-sm text-neutral-500">
            Mark attendance per class per date (weighted). Uses active section + lab group.
          </div>
        </div>
        <AttendancePanel />
      </div>
    </AppShell>
  );
}
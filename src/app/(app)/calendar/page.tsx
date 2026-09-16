import AppShell from "@/components/AppShell";
import CalendarClient from "@/components/CalenderClient";

export default function CalendarPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">Calendar</div>
          <div className="text-sm text-neutral-500">Shows holiday + attendance day markers.</div>
        </div>
        <CalendarClient />
      </div>
    </AppShell>
  );
}
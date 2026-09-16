import AppShell from "@/components/AppShell";
import TimetableEditor from "@/components/TimetableEditor";

export default function TimetablePage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">Timetable</div>
          <div className="text-sm text-neutral-500">
            Works per section profile and lab group. Use Import (OCR) for your PDF.
          </div>
        </div>
        <TimetableEditor />
      </div>
    </AppShell>
  );
}
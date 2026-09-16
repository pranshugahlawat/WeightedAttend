import AppShell from "@/components/AppShell";
import ImportWizard from "@/components/ImportWizard";

export default function ImportPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">Import Timetable (OCR)</div>
          <div className="text-sm text-neutral-500">
            Upload your timetable PDF/image, select page + lab group, then apply. Imported one becomes default.
          </div>
        </div>
        <ImportWizard />
      </div>
    </AppShell>
  );
}
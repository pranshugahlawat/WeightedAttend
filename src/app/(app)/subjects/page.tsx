import AppShell from "@/components/AppShell";
import SubjectDialog from "@/components/SubjectDialog";
import { requireUserId } from "@/lib/requireUser";
import { prisma } from "@/lib/db";
import SubjectsTable from "@/components/SubjectsTable";

export default async function SubjectsPage() {
  const userId = await requireUserId();
  const subjects = await prisma.subject.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">Subjects</div>
            <div className="text-sm text-neutral-500">
              Subject-wise stats update as you mark attendance.
            </div>
          </div>

          <SubjectDialog onDone={() => location.reload()} />
        </div>

        <SubjectsTable subjects={subjects} />
      </div>
    </AppShell>
  );
}
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/requireUser";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUserId();
  } catch {
    redirect("/signin");
  }

  return <>{children}</>;
}
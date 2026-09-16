import Nav from "@/components/Nav";
import ContextSwitcher from "@/components/ContextSwitcher";
import SignOutButton from "@/components/SignOutButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Nav />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <ContextSwitcher />
          <SignOutButton />
        </div>

        {children}
      </main>
    </div>
  );
}
import Nav from "@/components/Nav";
import ContextSwitcher from "@/components/ContextSwitcher";
import { signOut } from "@/auth";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Nav />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <ContextSwitcher />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/signin" });
            }}
          >
            <button className="text-sm px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50">
              Sign out
            </button>
          </form>
        </div>

        {children}
      </main>
    </div>
  );
}
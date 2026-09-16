import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md border rounded-lg p-6 bg-white">
        <div className="text-xl font-semibold">WeightedAttend — Sign in</div>
        <div className="text-sm text-neutral-500 mt-1">Use the same email as your recruitment form.</div>

        <form
          className="mt-4 space-y-3"
          action={async (formData) => {
            "use server";
            await signIn("credentials", {
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
              redirectTo: "/dashboard"
            });
          }}
        >
          <input name="email" type="email" className="w-full border rounded-md p-2" placeholder="Email" required />
          <input name="password" type="password" className="w-full border rounded-md p-2" placeholder="Password" required />
          <button className="w-full bg-black text-white rounded-md p-2">Sign in</button>
        </form>

        <a href="/signup" className="text-sm text-blue-700 hover:underline mt-3 inline-block">
          Create account
        </a>
      </div>
    </div>
  );
}
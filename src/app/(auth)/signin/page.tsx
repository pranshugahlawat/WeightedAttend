"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    await signIn("credentials", {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      callbackUrl: "/dashboard"
    });

    setBusy(false);
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md border rounded-lg p-6 bg-white">
        <div className="text-xl font-semibold">WeightedAttend — Sign in</div>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <input name="email" type="email" className="w-full border rounded-md p-2" placeholder="Email" required />
          <input name="password" type="password" className="w-full border rounded-md p-2" placeholder="Password" required />
          <button disabled={busy} className="w-full bg-black text-white rounded-md p-2 disabled:opacity-60">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <a href="/signup" className="text-sm text-blue-700 hover:underline mt-3 inline-block">
          Create account
        </a>
      </div>
    </div>
  );
}
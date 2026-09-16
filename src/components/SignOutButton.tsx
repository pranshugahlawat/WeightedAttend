"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="text-sm px-3 py-2 rounded-md border border-neutral-200 hover:bg-neutral-50"
    >
      Sign out
    </button>
  );
}
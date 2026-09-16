"use client"

export default function SignupPage() {
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md border rounded-lg p-6 bg-white">
        <div className="text-xl font-semibold">WeightedAttend — Create account</div>
        <div className="text-sm text-neutral-500 mt-1">Local credentials auth.</div>

        <SignupClient />
      </div>
    </div>
  );
}

function SignupClient() {
  "use client";

  const onSubmit = async (e: any) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        password: form.get("password")
      })
    });

    if (!res.ok) {
      alert((await res.json())?.error ?? "Failed");
      return;
    }
    window.location.href = "/signin";
  };

  return (
    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
      <input name="name" className="w-full border rounded-md p-2" placeholder="Name (optional)" />
      <input name="email" type="email" className="w-full border rounded-md p-2" placeholder="Email" required />
      <input name="password" type="password" className="w-full border rounded-md p-2" placeholder="Password (min 6)" required />
      <button className="w-full bg-black text-white rounded-md p-2">Create</button>

      <a href="/signin" className="text-sm text-blue-700 hover:underline inline-block">
        Back to sign in
      </a>
    </form>
  );
}
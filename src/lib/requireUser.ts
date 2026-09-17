import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

export async function requireUserId() {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const token = await getToken({
    req: { headers: { cookie } } as any,
    secret: process.env.NEXTAUTH_SECRET
  });

  const userId = token?.sub;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
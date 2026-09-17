import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function requireUserId() {
  // 1) Best path for Server Components / layouts
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  if (sessionUserId) return sessionUserId;

  // 2) Fallback path (works well in route handlers too)
  const c = await cookies();
  const cookieHeader = c.getAll().map(x => `${x.name}=${x.value}`).join("; ");

  const token = await getToken({
    req: { headers: { cookie: cookieHeader } } as any,
    secret: process.env.NEXTAUTH_SECRET
  });

  const userId = token?.sub;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function requireUserId() {
  const c = await cookies();
  const cookieHeader = c
    .getAll()
    .map((x) => `${x.name}=${x.value}`)
    .join("; ");

  const token = await getToken({
    req: { headers: { cookie: cookieHeader } } as any,
    secret: process.env.NEXTAUTH_SECRET
  });

  const userId = token?.sub;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
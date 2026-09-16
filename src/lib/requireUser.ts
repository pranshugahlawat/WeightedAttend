import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
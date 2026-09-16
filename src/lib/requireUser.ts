import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { ActionError } from "@/lib/action";

// Every action starts here. Returns the app's user row, not Clerk's user.
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new ActionError("Unauthorized");

  // The row is created on first sign-up. Creating it here rather than in the
  // root layout is what makes it reliable: a layout is not re-rendered during
  // the client-side navigation Clerk performs after sign-up, so a header-based
  // upsert is skipped entirely for exactly the user who needs it. The findUnique
  // hits on every request but the first, so this costs nothing on the happy path.
  const user =
    (await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    })) ?? (await checkUser());

  if (!user) throw new ActionError("User not found");

  return user;
}

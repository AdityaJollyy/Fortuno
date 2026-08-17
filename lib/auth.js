import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/prisma";
import { ActionError } from "@/lib/action";

// Every action starts here. Returns the app's user row, not Clerk's user.
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new ActionError("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!user) throw new ActionError("User not found");

  return user;
}

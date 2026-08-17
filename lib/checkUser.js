import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  try {
    return await db.user.upsert({
      where: { clerkUserId: user.id },
      update: {},
      create: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      // Unique constraint failed → user already created by another request
      return await db.user.findUnique({
        where: { clerkUserId: user.id },
      });
    }

    console.error("Error checking/creating user:", error);
    return null;
  }
};

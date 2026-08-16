"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/prisma";
import { serializeAccount } from "@/lib/serialize";
import { accountSchema } from "@/app/lib/schema";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");

  return user;
}

export async function getUserAccounts() {
  const user = await requireUser();

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return accounts.map(serializeAccount);
}

export async function createAccount(formData) {
  const user = await requireUser();

  const data = accountSchema.parse(formData);

  const account = await db.$transaction(async (tx) => {
    const existingCount = await tx.account.count({
      where: { userId: user.id },
    });

    const shouldBeDefault = existingCount === 0 ? true : data.isDefault;

    if (shouldBeDefault) {
      await tx.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance,
        isDefault: shouldBeDefault,
        userId: user.id,
      },
    });
  });

  revalidatePath("/dashboard");
  return serializeAccount(account);
}

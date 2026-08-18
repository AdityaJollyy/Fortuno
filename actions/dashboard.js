"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/action";
import { serializeAccount } from "@/lib/serialize";
import { accountSchema } from "@/app/lib/schema";
import { requireWithinRateLimit } from "@/lib/ratelimit";

export async function getUserAccounts() {
  try {
    const user = await requireUser();

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return ok(accounts.map(serializeAccount));
  } catch (error) {
    return fail(error);
  }
}

export async function createAccount(formData) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

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
    return ok(serializeAccount(account));
  } catch (error) {
    return fail(error);
  }
}

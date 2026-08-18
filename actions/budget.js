"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/action";
import { serializeBudget, decimalToNumber } from "@/lib/serialize";
import { budgetAmountSchema } from "@/app/lib/schema";
import { requireWithinRateLimit } from "@/lib/ratelimit";

export async function getCurrentBudget(accountId) {
  try {
    const user = await requireUser();

    const budget = await db.budget.findUnique({
      where: { userId: user.id },
    });

    // The month window is [start of this month, start of next month).
    // `new Date(y, m + 1, 0)` is midnight on the last day of the month, so
    // using it as an upper bound silently drops that entire final day.
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        accountId,
        type: "EXPENSE",
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });

    return ok({
      budget: budget ? serializeBudget(budget) : null,
      currentExpenses: decimalToNumber(expenses._sum.amount),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function updateBudget(amount) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    const value = budgetAmountSchema.parse(amount);

    const budget = await db.budget.upsert({
      where: { userId: user.id },
      update: { amount: value },
      create: { userId: user.id, amount: value },
    });

    revalidatePath("/dashboard");
    return ok(serializeBudget(budget));
  } catch (error) {
    return fail(error);
  }
}

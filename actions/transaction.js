"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireWithinRateLimit } from "@/lib/ratelimit";
import { ActionError, ok, fail } from "@/lib/action";
import { serializeTransaction } from "@/lib/serialize";
import { transactionSchema, transactionIdSchema } from "@/app/lib/schema";

function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

export async function getTransaction(id) {
  try {
    const user = await requireUser();

    const transactionId = transactionIdSchema.parse(id);

    const transaction = await db.transaction.findFirst({
      where: { id: transactionId, userId: user.id },
    });

    if (!transaction) return ok(null);

    return ok(serializeTransaction(transaction));
  } catch (error) {
    return fail(error);
  }
}

export async function createTransaction(formData) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    const data = transactionSchema.parse(formData);

    const transaction = await db.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: data.accountId, userId: user.id },
        select: { id: true },
      });

      if (!account) throw new ActionError("Account not found");

      const created = await tx.transaction.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date,
          category: data.category,
          isRecurring: data.isRecurring,
          recurringInterval: data.isRecurring ? data.recurringInterval : null,
          nextRecurringDate: data.isRecurring
            ? calculateNextRecurringDate(data.date, data.recurringInterval)
            : null,
          accountId: account.id,
          userId: user.id,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance:
            data.type === "EXPENSE"
              ? { decrement: data.amount }
              : { increment: data.amount },
        },
      });

      return created;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return ok(serializeTransaction(transaction));
  } catch (error) {
    return fail(error);
  }
}

export async function updateTransaction(id, formData) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    const transactionId = transactionIdSchema.parse(id);
    const data = transactionSchema.parse(formData);

    const { transaction, previousAccountId } = await db.$transaction(
      async (tx) => {
        const original = await tx.transaction.findFirst({
          where: { id: transactionId, userId: user.id },
          select: { id: true, type: true, amount: true, accountId: true },
        });

        if (!original) throw new ActionError("Transaction not found");

        const account = await tx.account.findFirst({
          where: { id: data.accountId, userId: user.id },
          select: { id: true },
        });

        if (!account) throw new ActionError("Account not found");

        // Reverse the original entry on the account it was posted to. The
        // tutorial skips this whenever the account changes, which credits the
        // new account without ever debiting the old one — inventing money.
        await tx.account.update({
          where: { id: original.accountId },
          data: {
            balance:
              original.type === "EXPENSE"
                ? { increment: original.amount }
                : { decrement: original.amount },
          },
        });

        // Then apply the new entry, which may be on a different account.
        await tx.account.update({
          where: { id: account.id },
          data: {
            balance:
              data.type === "EXPENSE"
                ? { decrement: data.amount }
                : { increment: data.amount },
          },
        });

        const updated = await tx.transaction.update({
          where: { id: original.id },
          data: {
            type: data.type,
            amount: data.amount,
            description: data.description,
            date: data.date,
            category: data.category,
            isRecurring: data.isRecurring,
            recurringInterval: data.isRecurring ? data.recurringInterval : null,
            nextRecurringDate: data.isRecurring
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
            accountId: account.id,
          },
        });

        return { transaction: updated, previousAccountId: original.accountId };
      },
    );

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    if (previousAccountId !== transaction.accountId) {
      revalidatePath(`/account/${previousAccountId}`);
    }

    return ok(serializeTransaction(transaction));
  } catch (error) {
    return fail(error);
  }
}

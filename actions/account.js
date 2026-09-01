"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActionError, ok, fail } from "@/lib/action";
import { serializeAccount, serializeTransaction } from "@/lib/serialize";
import {
  transactionIdsSchema,
  accountIdSchema,
  accountNameSchema,
} from "@/app/lib/schema";
import { requireWithinRateLimit } from "@/lib/ratelimit";

export async function getAccountWithTransactions(accountId) {
  try {
    const user = await requireUser();

    // A junk id in the URL is a missing account, not a crash — the page turns
    // this into notFound().
    const parsed = accountIdSchema.safeParse(accountId);
    if (!parsed.success) return ok(null);

    // findFirst, not findUnique: the id alone is unique, but we must also
    // scope by userId so one user cannot read another user's account.
    const account = await db.account.findFirst({
      where: { id: parsed.data, userId: user.id },
      include: {
        transactions: { orderBy: { date: "desc" } },
        _count: { select: { transactions: true } },
      },
    });

    if (!account) return ok(null);

    return ok({
      ...serializeAccount(account),
      transactions: account.transactions.map(serializeTransaction),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    const ids = transactionIdsSchema.parse(transactionIds);

    const result = await db.$transaction(async (tx) => {
      // Sum the rows per account and type before deleting them, so the
      // arithmetic happens in Postgres and never touches a JS number.
      const grouped = await tx.transaction.groupBy({
        by: ["accountId", "type"],
        where: { id: { in: ids }, userId: user.id },
        _sum: { amount: true },
      });

      if (grouped.length === 0) {
        throw new ActionError("No transactions found");
      }

      const { count } = await tx.transaction.deleteMany({
        where: { id: { in: ids }, userId: user.id },
      });

      // Undo each group's effect: deleting an expense gives the money back,
      // deleting income takes it away. At most two updates per account.
      for (const group of grouped) {
        await tx.account.update({
          where: { id: group.accountId },
          data: {
            balance:
              group.type === "EXPENSE"
                ? { increment: group._sum.amount }
                : { decrement: group._sum.amount },
          },
        });
      }

      return {
        count,
        accountIds: [...new Set(grouped.map((g) => g.accountId))],
      };
    });

    revalidatePath("/dashboard");
    for (const accountId of result.accountIds) {
      revalidatePath(`/account/${accountId}`);
    }

    return ok({ count: result.count });
  } catch (error) {
    return fail(error);
  }
}

export async function updateAccountName(accountId, name) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    const id = accountIdSchema.parse(accountId);
    const newName = accountNameSchema.parse(name);

    // updateMany, so userId stays a real filter: someone else's id matches
    // nothing and updates nothing.
    const { count } = await db.account.updateMany({
      where: { id, userId: user.id },
      data: { name: newName },
    });

    if (count === 0) throw new ActionError("Account not found");

    revalidatePath("/dashboard");
    revalidatePath(`/account/${id}`);

    return ok({ id, name: newName });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAccount(accountId) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    const id = accountIdSchema.parse(accountId);

    const result = await db.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id, userId: user.id },
        select: {
          id: true,
          isDefault: true,
          _count: { select: { transactions: true } },
        },
      });

      if (!account) throw new ActionError("Account not found");

      // The transactions go with it — Transaction.accountId is
      // onDelete: Cascade — so there are no balances left to correct.
      await tx.account.delete({ where: { id: account.id } });

      // The budget and the transaction form both assume a default account
      // exists, so hand the badge on instead of leaving the user with none.
      let promoted = null;

      if (account.isDefault) {
        promoted = await tx.account.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        });

        if (promoted) {
          await tx.account.update({
            where: { id: promoted.id },
            data: { isDefault: true },
          });
        }
      }

      return { transactionCount: account._count.transactions, promoted };
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${id}`);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function updateDefaultAccount(accountId) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    const id = accountIdSchema.parse(accountId);

    const account = await db.$transaction(async (tx) => {
      const target = await tx.account.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });

      if (!target) throw new ActionError("Account not found");

      await tx.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });

      return tx.account.update({
        where: { id: target.id },
        data: { isDefault: true },
      });
    });

    revalidatePath("/dashboard");
    return ok(serializeAccount(account));
  } catch (error) {
    return fail(error);
  }
}

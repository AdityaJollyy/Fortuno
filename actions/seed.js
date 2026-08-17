"use server";

import { subDays } from "date-fns";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActionError, ok, fail } from "@/lib/action";

// Ranges are in whole rupees.
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [60000, 120000] },
    { name: "freelance", range: [10000, 40000] },
    { name: "investments", range: [2000, 25000] },
    { name: "other-income", range: [500, 5000] },
  ],
  EXPENSE: [
    { name: "housing", range: [15000, 35000] },
    { name: "transportation", range: [1000, 6000] },
    { name: "groceries", range: [3000, 12000] },
    { name: "utilities", range: [1500, 5000] },
    { name: "entertainment", range: [500, 3000] },
    { name: "food", range: [300, 2500] },
    { name: "shopping", range: [1000, 15000] },
    { name: "healthcare", range: [500, 20000] },
    { name: "education", range: [2000, 25000] },
    { name: "travel", range: [5000, 50000] },
  ],
};

// Amounts are generated in paise (integers) so no float ever touches money.
function randomPaise(minRupees, maxRupees) {
  const min = minRupees * 100;
  const max = maxRupees * 100;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function paiseToAmount(paise) {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  return {
    category: category.name,
    paise: randomPaise(category.range[0], category.range[1]),
  };
}

export async function seedTransactions() {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new ActionError("Seeding is disabled in production");
    }

    const user = await requireUser();

    const account = await db.account.findFirst({
      where: { userId: user.id, isDefault: true },
      select: { id: true },
    });

    if (!account) {
      throw new ActionError("Create a default account before seeding");
    }

    const transactions = [];
    let totalPaise = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, paise } = getRandomCategory(type);

        transactions.push({
          type,
          amount: paiseToAmount(paise),
          description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: user.id,
          accountId: account.id,
          createdAt: date,
          updatedAt: date,
        });

        totalPaise += type === "INCOME" ? paise : -paise;
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { accountId: account.id, userId: user.id },
      });

      await tx.transaction.createMany({ data: transactions });

      // The seeded account's balance is exactly the sum of its transactions.
      await tx.account.update({
        where: { id: account.id },
        data: { balance: paiseToAmount(totalPaise) },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${account.id}`);

    return ok({ count: transactions.length });
  } catch (error) {
    return fail(error);
  }
}

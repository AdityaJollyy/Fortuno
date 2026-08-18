import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { decimalToNumber } from "@/lib/serialize";
import { formatCurrency } from "@/lib/format";
import EmailTemplate from "@/emails/template";

const BUDGET_ALERT_THRESHOLD = Number(process.env.BUDGET_ALERT_THRESHOLD ?? 80);

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);

  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

// The schedule lives in nextRecurringDate. The tutorial returns true whenever
// lastProcessed is null, which fires a brand new recurring transaction on the
// very next cron run regardless of its interval.
function isDue(transaction) {
  if (!transaction.nextRecurringDate) return true;
  return new Date(transaction.nextRecurringDate) <= new Date();
}

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// 1. Post one occurrence of a recurring transaction
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    const { transactionId, userId } = event.data ?? {};

    if (!transactionId || !userId) {
      console.error("Invalid event data:", event);
      return { skipped: "missing event data" };
    }

    return step.run("post-recurring-transaction", async () => {
      const template = await db.transaction.findFirst({
        where: { id: transactionId, userId, isRecurring: true },
      });

      if (!template || !isDue(template)) return { skipped: "not due" };

      return db.$transaction(async (tx) => {
        // Claim the schedule first. If a retry or a duplicate event already
        // advanced it, this matches nothing and we stop — so a step that is
        // retried after a partial failure cannot post the money twice.
        const claimed = await tx.transaction.updateMany({
          where: {
            id: template.id,
            nextRecurringDate: template.nextRecurringDate,
          },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              template.recurringInterval,
            ),
          },
        });

        if (claimed.count === 0) return { skipped: "already processed" };

        await tx.transaction.create({
          data: {
            type: template.type,
            amount: template.amount,
            description: template.description
              ? `${template.description} (Recurring)`
              : "Recurring transaction",
            date: new Date(),
            category: template.category,
            userId: template.userId,
            accountId: template.accountId,
            isRecurring: false,
          },
        });

        await tx.account.update({
          where: { id: template.accountId },
          data: {
            balance:
              template.type === "EXPENSE"
                ? { decrement: template.amount }
                : { increment: template.amount },
          },
        });

        return { posted: true };
      });
    });
  },
);

// Fan out one event per due recurring transaction
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const due = await step.run("fetch-due-transactions", async () => {
      return db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          nextRecurringDate: { lte: new Date() },
        },
        select: { id: true, userId: true },
      });
    });

    if (due.length > 0) {
      await inngest.send(
        due.map((transaction) => ({
          name: "transaction.recurring.process",
          data: { transactionId: transaction.id, userId: transaction.userId },
        })),
      );
    }

    return { triggered: due.length };
  },
);

// 2. Monthly report
async function getMonthlyStats(userId, month) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOfNext = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  // Postgres does the sums. `new Date(y, m + 1, 0)` as an upper bound is
  // midnight on the last day, which drops that whole day's transactions.
  const [totals, byCategory] = await Promise.all([
    db.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: start, lt: startOfNext } },
      _sum: { amount: true },
      _count: true,
    }),
    db.transaction.groupBy({
      by: ["category"],
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: start, lt: startOfNext },
      },
      _sum: { amount: true },
    }),
  ]);

  const income = totals.find((row) => row.type === "INCOME");
  const expense = totals.find((row) => row.type === "EXPENSE");

  return {
    totalIncome: decimalToNumber(income?._sum.amount),
    totalExpenses: decimalToNumber(expense?._sum.amount),
    transactionCount: (income?._count ?? 0) + (expense?._count ?? 0),
    byCategory: Object.fromEntries(
      byCategory.map((row) => [row.category, decimalToNumber(row._sum.amount)]),
    ),
  };
}

const FALLBACK_INSIGHTS = [
  "Your highest expense category this month might need attention.",
  "Consider setting up a budget for better financial management.",
  "Track your recurring expenses to identify potential savings.",
];

async function generateFinancialInsights(stats, month) {
  const categories = Object.entries(stats.byCategory)
    .map(([category, amount]) => `${category}: ${formatCurrency(amount)}`)
    .join(", ");

  const prompt = `Financial data for ${month}:
- Total income: ${formatCurrency(stats.totalIncome)}
- Total expenses: ${formatCurrency(stats.totalExpenses)}
- Net: ${formatCurrency(stats.totalIncome - stats.totalExpenses)}
- Expenses by category: ${categories || "none"}

Give exactly 3 short, actionable insights about these spending patterns.
Be friendly and conversational. All amounts are Indian Rupees.
Reply with JSON in this shape: {"insights": ["...", "...", "..."]}`;

  try {
    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a friendly personal finance coach. Reply with JSON only.",
        },
        { role: "user", content: prompt },
      ],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

    const insights = Array.isArray(parsed.insights)
      ? parsed.insights.filter((insight) => typeof insight === "string")
      : [];

    return insights.length > 0 ? insights.slice(0, 3) : FALLBACK_INSIGHTS;
  } catch (error) {
    console.error("Failed to generate insights:", error);
    return FALLBACK_INSIGHTS;
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return db.user.findMany({
        select: { id: true, name: true, email: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);

        // Nothing happened last month — no report worth sending.
        if (stats.transactionCount === 0) return { skipped: "no activity" };

        const monthName = lastMonth.toLocaleString("en-IN", { month: "long" });
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name ?? "there",
            type: "monthly-report",
            data: { stats, month: monthName, insights },
          }),
        });

        return { sent: true };
      });
    }

    return { processed: users.length };
  },
);

// 3. Budget alerts
export const checkBudgetAlerts = inngest.createFunction(
  {
    id: "check-budget-alerts",
    name: "Check Budget Alerts",
  },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: { where: { isDefault: true } },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue;

      await step.run(`check-budget-${budget.id}`, async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: { gte: startOfMonth },
          },
          _sum: { amount: true },
        });

        // budget.amount is a Prisma Decimal. Dividing it by a JS number
        // gives NaN, so every alert comparison silently failed.
        const budgetAmount = decimalToNumber(budget.amount);
        const totalExpenses = decimalToNumber(expenses._sum.amount);

        if (budgetAmount <= 0) return { skipped: "no budget set" };

        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        const alreadyAlerted =
          budget.lastAlertSent &&
          !isNewMonth(new Date(budget.lastAlertSent), now);

        if (percentageUsed < BUDGET_ALERT_THRESHOLD || alreadyAlerted) {
          return { skipped: "no alert needed" };
        }

        await sendEmail({
          to: budget.user.email,
          subject: `Budget Alert for ${defaultAccount.name}`,
          react: EmailTemplate({
            userName: budget.user.name ?? "there",
            type: "budget-alert",
            data: {
              percentageUsed,
              budgetAmount,
              totalExpenses,
              accountName: defaultAccount.name,
            },
          }),
        });

        await db.budget.update({
          where: { id: budget.id },
          data: { lastAlertSent: now },
        });

        return { sent: true };
      });
    }

    return { checked: budgets.length };
  },
);

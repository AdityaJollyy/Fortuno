import { z } from "zod";

const MONEY_REGEX = /^\d+(\.\d{1,2})?$/;

const moneyString = (label) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(MONEY_REGEX, "Enter a valid amount (up to 2 decimals)");

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name is too long"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: moneyString("Initial balance"),
  isDefault: z.boolean(),
});

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: moneyString("Amount").refine(
      (value) => Number(value) > 0,
      "Amount must be greater than 0",
    ),
    description: z.string().trim().max(200).optional(),
    date: z.date({ error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean(),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: "custom",
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });

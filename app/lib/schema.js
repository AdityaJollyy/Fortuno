import { z } from "zod";

import { defaultCategories } from "@/data/categories";

const MONEY_REGEX = /^\d+(\.\d{1,2})?$/;

const CATEGORY_IDS = defaultCategories.map((category) => category.id);

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
    date: z
      .date({ error: "Date is required" })
      // Checked per parse, not at module load, so it cannot go stale.
      .refine((value) => value <= new Date(), "Date cannot be in the future"),
    accountId: z.uuid("Account is required"),
    category: z.enum(CATEGORY_IDS, { error: "Category is required" }),
    isRecurring: z.boolean(),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      // nullish, not optional: Base UI Select uses null for "nothing selected",
      // and .optional() accepts undefined only — null fails validation.
      .nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: "custom",
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }

    // A category belongs to one side of the ledger. Switching type in the form
    // leaves the old category selected, so the server has to catch it.
    const category = defaultCategories.find(
      (item) => item.id === data.category,
    );

    if (category && category.type !== data.type) {
      ctx.addIssue({
        code: "custom",
        message: "Category does not match the transaction type",
        path: ["category"],
      });
    }
  });

export const transactionIdSchema = z.uuid("Invalid transaction id");

export const transactionIdsSchema = z
  .array(transactionIdSchema)
  .min(1, "Select at least one transaction")
  .max(500, "You can delete at most 500 transactions at a time");

export const budgetAmountSchema = moneyString("Budget amount").refine(
  (value) => Number(value) > 0,
  "Budget must be greater than 0",
);

export const EXPENSE_CATEGORY_IDS = defaultCategories
  .filter((category) => category.type === "EXPENSE")
  .map((category) => category.id);

// The model's output is untrusted input like any other, so it gets parsed.
export const receiptSchema = z.object({
  amount: z.number().positive("Could not read an amount from that receipt"),
  date: z.string().nullish(),
  merchantName: z.string().nullish(),
  description: z.string().nullish(),
  category: z.enum(EXPENSE_CATEGORY_IDS).nullish(),
});

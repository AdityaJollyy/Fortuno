"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireWithinRateLimit } from "@/lib/ratelimit";
import { ActionError, ok, fail } from "@/lib/action";
import { serializeTransaction } from "@/lib/serialize";
import {
  transactionSchema,
  transactionIdSchema,
  receiptSchema,
  EXPENSE_CATEGORY_IDS,
} from "@/app/lib/schema";
import { ai, AI_MODEL } from "@/lib/ai";

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

        // Reverse the original entry on the account it was posted to.
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

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const RECEIPT_PROMPT = `You extract expense details from photographs of receipts and invoices.

Reply with a single JSON object and nothing else, in exactly this shape:
{
  "isReceipt": boolean,
  "amount": number,
  "date": "YYYY-MM-DD",
  "merchantName": string,
  "description": string,
  "category": string
}

Rules:
- "amount" is the final total actually paid, including tax. Never a subtotal,
  a single line item, or an amount tendered.
- Report the number exactly as printed. Do not convert currencies.
- "description" is a short summary of what was bought, not the shop name.
- "category" must be exactly one of: ${EXPENSE_CATEGORY_IDS.join(", ")}.
  Use "other-expense" when nothing fits.
- If the date is missing or unreadable, omit the "date" field.
- If the image is not a receipt or invoice, return {"isReceipt": false} only.`;

export async function scanReceipt(file) {
  try {
    const user = await requireUser();
    await requireWithinRateLimit(user.id);

    if (!file || typeof file.arrayBuffer !== "function") {
      throw new ActionError("No image received");
    }

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      throw new ActionError("Upload a JPEG, PNG, WebP or HEIC image");
    }

    // The client checks this too, but the action is a public endpoint.
    if (file.size === 0 || file.size > MAX_RECEIPT_BYTES) {
      throw new ActionError("Receipt must be between 1 byte and 5MB");
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      // Guarantees parseable output; the prompt must still say "JSON".
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: RECEIPT_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the receipt details as JSON." },
            {
              type: "image_url",
              image_url: { url: `data:${file.type};base64,${base64}` },
            },
          ],
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new ActionError(
        "Could not read that receipt. Try a clearer photo.",
      );
    }

    let raw;
    try {
      raw = JSON.parse(content);
    } catch {
      throw new ActionError(
        "Could not read that receipt. Try a clearer photo.",
      );
    }

    if (raw.isReceipt === false) {
      throw new ActionError("That image does not look like a receipt");
    }

    const receipt = receiptSchema.parse(raw);

    // The transaction form rejects future dates, so an unreadable or
    // nonsense date falls back to today rather than failing on submit.
    const scanned = receipt.date ? new Date(receipt.date) : null;
    const isUsable =
      scanned && !Number.isNaN(scanned.getTime()) && scanned <= new Date();

    return ok({
      // The model returns a number; this is the one place it becomes the
      // money string every other layer expects.
      amount: receipt.amount.toFixed(2),
      date: isUsable ? scanned : new Date(),
      description: receipt.description ?? receipt.merchantName ?? "",
      category: receipt.category ?? null,
    });
  } catch (error) {
    return fail(error);
  }
}

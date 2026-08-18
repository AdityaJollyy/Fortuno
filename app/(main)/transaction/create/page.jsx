import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getUserAccounts } from "@/actions/dashboard";
import { getTransaction } from "@/actions/transaction";
import { unwrap } from "@/lib/action";
import { defaultCategories } from "@/data/categories";

import { TransactionForm } from "../_components/TransactionForm";

export default async function AddTransactionPage({ searchParams }) {
  await auth.protect();

  const { edit: editId } = await searchParams;

  const accounts = unwrap(await getUserAccounts());
  const initialData = editId ? unwrap(await getTransaction(editId)) : null;

  if (editId && !initialData) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-5">
      <div className="mb-8 flex justify-center md:justify-normal">
        <h1 className="gradient gradient-title text-5xl font-bold tracking-tight">
          {editId ? "Edit Transaction" : "Add Transaction"}
        </h1>
      </div>

      <TransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={Boolean(editId)}
        initialData={initialData}
      />
    </div>
  );
}

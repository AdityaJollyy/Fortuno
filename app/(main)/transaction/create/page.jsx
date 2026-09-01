import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";

import { getUserAccounts } from "@/actions/dashboard";
import { getTransaction } from "@/actions/transaction";
import { unwrap } from "@/lib/action";
import { defaultCategories } from "@/data/categories";

import { TransactionForm } from "../_components/TransactionForm";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export default async function AddTransactionPage({ searchParams }) {
  await auth.protect();

  const { edit: editId } = await searchParams;

  const accounts = unwrap(await getUserAccounts());
  const initialData = editId ? unwrap(await getTransaction(editId)) : null;

  if (editId && !initialData) {
    notFound();
  }

  // No gutter here — (main)/layout.js already owns the frame gutters.
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 space-y-3 md:mb-7">
        <Link
          href="/dashboard"
          className={`${LABEL} hover:text-foreground ease-standard inline-flex items-center gap-1.5 transition-colors duration-(--animate-duration-fast)`}
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Dashboard
        </Link>

        <h1 className="text-h2 md:text-h1 font-heading text-foreground font-extrabold tracking-tight">
          {editId ? "Edit transaction" : "Add transaction"}
        </h1>
      </header>

      <TransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={Boolean(editId)}
        initialData={initialData}
      />
    </div>
  );
}

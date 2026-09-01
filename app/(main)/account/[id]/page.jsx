import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";

import { getAccountWithTransactions } from "@/actions/account";
import { unwrap } from "@/lib/action";
import { formatCurrency } from "@/lib/format";

import { AccountActions } from "@/components/AccountActions";
import { AccountActivity } from "../_components/AccountActivity";
import { TransactionTable } from "../_components/TransactionTable";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export default async function AccountPage({ params }) {
  await auth.protect();

  const { id } = await params;

  const accountData = unwrap(await getAccountWithTransactions(id));

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  const transactionCount = account._count.transactions;

  return (
    <div className="space-y-6 md:space-y-7">
      <header className="space-y-3">
        <Link
          href="/dashboard"
          className={`${LABEL} hover:text-foreground ease-standard inline-flex items-center gap-1.5 transition-colors duration-(--animate-duration-fast)`}
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Dashboard
        </Link>

        <p className={LABEL}>
          {account.type.charAt(0) + account.type.slice(1).toLowerCase()} ·{" "}
          {transactionCount === 1
            ? "1 transaction"
            : `${transactionCount} transactions`}
          {account.isDefault ? " · Default" : ""}
        </p>

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-h2 md:text-h1 font-heading text-foreground font-extrabold tracking-tight capitalize">
            {account.name}
          </h1>

          <AccountActions
            accountId={account.id}
            name={account.name}
            transactionCount={transactionCount}
            isDefault={account.isDefault}
            redirectOnDelete
          />
        </div>

        <p className="text-money-lg md:text-money-xl font-heading text-foreground font-extrabold tabular-nums">
          {formatCurrency(account.balance)}
        </p>
      </header>

      <AccountActivity transactions={transactions} />

      <TransactionTable transactions={transactions} />
    </div>
  );
}

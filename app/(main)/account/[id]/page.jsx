import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getAccountWithTransactions } from "@/actions/account";
import { unwrap } from "@/lib/action";
import { formatCurrency } from "@/lib/format";

import { AccountChart } from "../_components/AccountChart";
import { TransactionTable } from "../_components/TransactionTable";

export default async function AccountPage({ params }) {
  await auth.protect();

  const { id } = await params;

  const accountData = unwrap(await getAccountWithTransactions(id));

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 px-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="gradient gradient-title text-5xl font-bold tracking-tight capitalize sm:text-6xl">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>

        <div className="pb-2 text-right">
          <div className="text-xl font-bold sm:text-2xl">
            {formatCurrency(account.balance)}
          </div>
          <p className="text-muted-foreground text-sm">
            {account._count.transactions} Transactions
          </p>
        </div>
      </div>

      <AccountChart transactions={transactions} />

      <TransactionTable transactions={transactions} />
    </div>
  );
}

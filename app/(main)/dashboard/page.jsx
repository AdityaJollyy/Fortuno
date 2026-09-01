import { Plus } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { unwrap } from "@/lib/action";
import { formatCurrencyWhole } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { CreateAccountDrawer } from "@/components/CreateAccountDrawer";
import { AccountCard } from "./_components/AccountCard";
import { BudgetProgress } from "./_components/BudgetProgress";
import { DashboardOverview } from "./_components/DashboardOverview";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export default async function DashboardPage() {
  await auth.protect();

  const [accountsResult, transactionsResult] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const accounts = unwrap(accountsResult);
  const transactions = unwrap(transactionsResult);

  const defaultAccount = accounts.find((account) => account.isDefault);

  // Depends on defaultAccount, so it cannot join the Promise.all above.
  const budgetData = defaultAccount
    ? unwrap(await getCurrentBudget(defaultAccount.id))
    : null;

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  // Nothing printed yet — one account is the whole prerequisite.
  if (accounts.length === 0) {
    return (
      <div>
        <section className="bg-card border-border rounded-t-xl border-x border-t p-5 md:p-6">
          <p className={LABEL}>Nothing printed yet</p>

          <h2 className="text-h3 font-heading text-foreground mt-3 font-extrabold tracking-tight">
            Add your first account.
          </h2>

          <p className="text-body text-ink-body mt-3 max-w-prose">
            Fortuno needs one account to start counting. Name it whatever you
            call it — HDFC, Paytm, cash in the drawer. You can add more later
            and pick which one your budget follows.
          </p>

          <CreateAccountDrawer nativeButton>
            <Button size="lg" className="mt-6 px-6">
              Add account
            </Button>
          </CreateAccountDrawer>
        </section>

        {/* Sibling of the card, so the punched holes fall on the page. */}
        <div className="receipt-edge" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      {budgetData && (
        <BudgetProgress
          initialBudget={budgetData.budget}
          currentExpenses={budgetData.currentExpenses}
          accountName={defaultAccount.name}
        />
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h4 font-heading text-foreground font-bold tracking-tight">
            Accounts
          </h2>
          <p className={LABEL}>{formatCurrencyWhole(totalBalance)} total</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}

          <CreateAccountDrawer nativeButton>
            <button
              type="button"
              data-slot="drawer-trigger"
              className="border-input text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring ease-standard flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors duration-(--animate-duration-fast) focus-visible:ring-2 focus-visible:outline-none"
            >
              <Plus className="size-6" aria-hidden="true" />
              <span className={LABEL}>New account</span>
            </button>
          </CreateAccountDrawer>
        </div>
      </section>

      <DashboardOverview accounts={accounts} transactions={transactions} />
    </div>
  );
}

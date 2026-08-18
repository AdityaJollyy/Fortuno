import { Plus } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { unwrap } from "@/lib/action";

import { Card, CardContent } from "@/components/ui/card";
import { CreateAccountDrawer } from "@/components/CreateAccountDrawer";
import { AccountCard } from "./_components/AccountCard";
import { BudgetProgress } from "./_components/BudgetProgress";
import { DashboardOverview } from "./_components/DashboardOverview";

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

  return (
    <div className="space-y-8">
      {budgetData && (
        <BudgetProgress
          initialBudget={budgetData.budget}
          currentExpenses={budgetData.currentExpenses}
        />
      )}

      {accounts.length > 0 && (
        <DashboardOverview accounts={accounts} transactions={transactions} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card
            data-slot="drawer-trigger"
            className="hover:bg-accent/50 cursor-pointer border-dashed transition-colors"
          >
            <CardContent className="text-muted-foreground flex h-full flex-col items-center justify-center py-8">
              <Plus className="mb-2 h-10 w-10" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}

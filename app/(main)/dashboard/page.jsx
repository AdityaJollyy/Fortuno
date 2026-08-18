import { Plus } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { getUserAccounts } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { unwrap } from "@/lib/action";

import { Card, CardContent } from "@/components/ui/card";
import { CreateAccountDrawer } from "@/components/CreateAccountDrawer";
import { AccountCard } from "./_components/AccountCard";
import { BudgetProgress } from "./_components/BudgetProgress";

export default async function DashboardPage() {
  await auth.protect();

  const accounts = unwrap(await getUserAccounts());
  const defaultAccount = accounts.find((account) => account.isDefault);

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer nativeButton={false}>
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

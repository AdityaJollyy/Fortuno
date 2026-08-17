import { Plus } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { getUserAccounts } from "@/actions/dashboard";
import { unwrap } from "@/lib/action";

import { Card, CardContent } from "@/components/ui/card";
import { CreateAccountDrawer } from "@/components/CreateAccountDrawer";

export default async function DashboardPage() {
  await auth.protect();

  const accounts = unwrap(await getUserAccounts());

  return (
    <div className="space-y-8">
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
      </div>
    </div>
  );
}

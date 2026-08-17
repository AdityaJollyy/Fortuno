"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { updateBudget } from "@/actions/budget";
import { formatCurrency } from "@/lib/format";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || "",
  );

  const { loading, fn: updateBudgetFn } = useFetch(updateBudget);

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const handleUpdateBudget = async () => {
    // Sent as a string. The action validates it, so no parseFloat here.
    const budget = await updateBudgetFn(newBudget);
    if (!budget) return;

    setIsEditing(false);
    toast.success("Budget updated");
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Monthly Budget (Default Account)
        </CardTitle>

        <div className="mt-1 flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                type="text"
                inputMode="decimal"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-32"
                placeholder="Enter amount"
                autoFocus
                disabled={loading}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUpdateBudget}
                disabled={loading}
                aria-label="Save budget"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={loading}
                aria-label="Cancel"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </>
          ) : (
            <>
              <CardDescription>
                {initialBudget
                  ? `${formatCurrency(currentExpenses)} of ${formatCurrency(initialBudget.amount)} spent`
                  : "No budget set"}
              </CardDescription>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsEditing(true)}
                aria-label="Edit budget"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {initialBudget && (
          <div className="space-y-2">
            <Progress
              value={Math.min(percentUsed, 100)}
              extraStyles={
                percentUsed >= 90
                  ? "bg-red-500"
                  : percentUsed >= 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }
            />
            <p className="text-muted-foreground text-right text-xs">
              {percentUsed.toFixed(1)}% used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

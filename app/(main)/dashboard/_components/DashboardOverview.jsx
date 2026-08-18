"use client";

import { useState } from "react";
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import { categoryColors, defaultCategories } from "@/data/categories";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CATEGORY_NAMES = Object.fromEntries(
  defaultCategories.map((category) => [category.id, category.name]),
);

// Beyond this the pie becomes unreadable, so the tail is rolled into "Other".
const MAX_SLICES = 6;
const OTHER_COLOR = "#94a3b8";

export function DashboardOverview({ accounts, transactions }) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((account) => account.isDefault)?.id ?? accounts[0]?.id,
  );

  const accountTransactions = transactions.filter(
    (transaction) => transaction.accountId === selectedAccountId,
  );

  // Already sorted by date desc on the server.
  const recentTransactions = accountTransactions.slice(0, 5);

  const now = new Date();
  const expensesByCategory = accountTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);

    const isThisMonth =
      transaction.type === "EXPENSE" &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isThisMonth) {
      acc[transaction.category] =
        (acc[transaction.category] ?? 0) + transaction.amount;
    }

    return acc;
  }, {});

  const sortedCategories = Object.entries(expensesByCategory).sort(
    (a, b) => b[1] - a[1],
  );

  const pieChartData = sortedCategories
    .slice(0, MAX_SLICES)
    .map(([id, value]) => ({
      id,
      name: CATEGORY_NAMES[id] ?? id,
      value,
      fill: categoryColors[id] ?? OTHER_COLOR,
    }));

  const remaining = sortedCategories.slice(MAX_SLICES);

  if (remaining.length > 0) {
    pieChartData.push({
      id: "other",
      name: `Other (${remaining.length})`,
      value: remaining.reduce((sum, [, value]) => sum + value, 0),
      fill: OTHER_COLOR,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">
            Recent Transactions
          </CardTitle>
          <CardAction>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {(value) =>
                    accounts.find((account) => account.id === value)?.name ??
                    "Select account"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                No recent transactions
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm leading-none font-medium">
                      {transaction.description || "Untitled Transaction"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(transaction.date), "PP")}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center",
                      transaction.type === "EXPENSE"
                        ? "text-red-500"
                        : "text-green-500",
                    )}
                  >
                    {transaction.type === "EXPENSE" ? (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    )}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">
            Monthly Expense Breakdown
          </CardTitle>
        </CardHeader>

        <CardContent>
          {pieChartData.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              No expenses this month
            </p>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                  />

                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      color: "var(--popover-foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                    }}
                  />

                  <Legend
                    position="bottom"
                    height={48}
                    formatter={(value) => (
                      <span className="text-muted-foreground text-xs">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

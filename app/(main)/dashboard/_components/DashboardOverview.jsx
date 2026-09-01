"use client";

import { useState } from "react";
import Link from "next/link";
import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";

import { defaultCategories, groupOf, chipClass } from "@/data/categories";
import { formatCurrency, formatSigned } from "@/lib/format";
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
import { Badge } from "@/components/ui/badge";

const CATEGORY_NAMES = Object.fromEntries(
  defaultCategories.map((category) => [category.id, category.name]),
);

// Beyond this the pie becomes unreadable, so the tail is rolled into "Other".
const MAX_SLICES = 6;

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

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

  // The chip tokens are CSS custom properties, not Tailwind classes, so the
  // group name is safe to build here — nothing scans this string.
  const pieChartData = sortedCategories
    .slice(0, MAX_SLICES)
    .map(([id, value]) => ({
      id,
      name: CATEGORY_NAMES[id] ?? id,
      value,
      group: groupOf(id),
      fill: `var(--cat-${groupOf(id)})`,
    }));

  const remaining = sortedCategories.slice(MAX_SLICES);

  if (remaining.length > 0) {
    pieChartData.push({
      id: "other",
      name: `Everything else (${remaining.length})`,
      value: remaining.reduce((sum, [, value]) => sum + value, 0),
      group: "other",
      fill: "var(--cat-other)",
    });
  }

  const totalExpenses = pieChartData.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Where it went */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4 font-bold tracking-tight">
            Where it went
          </CardTitle>
          <CardAction className={LABEL}>{format(now, "MMMM")}</CardAction>
        </CardHeader>

        <CardContent>
          {pieChartData.length === 0 ? (
            <p className="text-body text-muted-foreground py-4">
              No expenses this month yet.
            </p>
          ) : (
            <>
              <div className="h-[200px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={86}
                      paddingAngle={1}
                      dataKey="value"
                      nameKey="name"
                      stroke="var(--card)"
                      // Recharts animates the arc path, which is neither
                      // opacity nor transform.
                      isAnimationActive={false}
                    />

                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value), name]}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        color: "var(--popover-foreground)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Every segment gets a row with its own amount — the chart is
                  never the only way to read the number. */}
              <dl className="mt-4">
                {pieChartData.map((slice) => (
                  <div
                    key={slice.id}
                    className="border-border flex items-baseline justify-between gap-3 border-b py-2.5 last:border-0"
                  >
                    <dt className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: `var(--cat-${slice.group})` }}
                      />
                      <span className="text-body-sm text-ink-body truncate">
                        {slice.name}
                      </span>
                    </dt>
                    <dd className="flex shrink-0 items-baseline gap-2">
                      <span className="text-money font-heading text-foreground font-semibold tabular-nums">
                        {formatCurrency(slice.value)}
                      </span>
                      <span className={`${LABEL} w-9 text-right`}>
                        {Math.round((slice.value / totalExpenses) * 100)}%
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      {/* Latest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4 font-bold tracking-tight">
            Latest
          </CardTitle>
          <CardAction>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger className="w-[140px]" aria-label="Account">
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
          {recentTransactions.length === 0 ? (
            <p className="text-body text-muted-foreground py-4">
              Nothing logged on this account yet.
            </p>
          ) : (
            <ul>
              {recentTransactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="border-border flex items-center justify-between gap-3 border-b py-3.5 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-body-sm text-foreground truncate font-medium">
                      {transaction.description || "Untitled transaction"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge
                        variant="category"
                        className={chipClass(transaction.category)}
                      >
                        {CATEGORY_NAMES[transaction.category] ??
                          transaction.category}
                      </Badge>
                      <time className={LABEL}>
                        {format(new Date(transaction.date), "dd MMM")}
                      </time>
                    </div>
                  </div>

                  <p
                    className={cn(
                      "text-money font-heading flex shrink-0 items-center gap-1 font-semibold tabular-nums",
                      transaction.type === "EXPENSE"
                        ? "text-destructive"
                        : "text-positive",
                    )}
                  >
                    {transaction.type === "EXPENSE" ? (
                      <ArrowDownRight className="size-4" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    )}
                    {formatSigned(transaction.amount, transaction.type)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {selectedAccountId && (
            <Link
              href={`/account/${selectedAccountId}`}
              className={`${LABEL} hover:text-foreground ease-standard mt-4 inline-flex items-center gap-1.5 transition-colors duration-(--animate-duration-fast)`}
            >
              All transactions
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

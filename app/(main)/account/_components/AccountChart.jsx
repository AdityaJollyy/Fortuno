"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

export function AccountChart({ transactions }) {
  const [dateRange, setDateRange] = useState("1M");

  const chartData = useMemo(() => {
    const { days } = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = days ? startOfDay(subDays(now, days)) : null;
    const endDate = endOfDay(now);

    const filtered = transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return (!startDate || date >= startDate) && date <= endDate;
    });

    // Group on an ISO key, not on the "MMM dd" label. The label has no year,
    // so Jan 05 of two different years would collapse into one bar.
    const grouped = filtered.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const key = format(date, "yyyy-MM-dd");

      if (!acc[key]) {
        acc[key] = {
          key,
          label: format(date, "MMM dd"),
          income: 0,
          expense: 0,
        };
      }

      if (transaction.type === "INCOME") {
        acc[key].income += transaction.amount;
      } else {
        acc[key].expense += transaction.amount;
      }

      return acc;
    }, {});

    // ISO keys sort correctly as plain strings — no Date parsing needed.
    return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions, dateRange]);

  const totals = useMemo(
    () =>
      chartData.reduce(
        (acc, day) => ({
          income: acc.income + day.income,
          expense: acc.expense + day.expense,
        }),
        { income: 0, expense: 0 },
      ),
    [chartData],
  );

  const net = totals.income - totals.expense;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-normal">
          Transaction Overview
        </CardTitle>
        <CardAction>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="mb-6 flex justify-around text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">
              {formatCurrency(totals.income)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
              {formatCurrency(totals.expense)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={cn(
                "text-lg font-bold",
                net >= 0 ? "text-green-500" : "text-red-500",
              )}
            >
              {formatCurrency(net)}
            </p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrencyCompact}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

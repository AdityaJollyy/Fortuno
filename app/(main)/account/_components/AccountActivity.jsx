"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  subMonths,
  differenceInCalendarMonths,
} from "date-fns";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { formatCurrencyWhole } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RANGES = {
  "6M": { label: "6M", full: "Last 6 months", months: 6 },
  "1Y": { label: "1Y", full: "Last 12 months", months: 12 },
  ALL: { label: "All", full: "All time", months: null },
};

// One row per month. "All" over a long history would print dozens of them, so
// past two years it rolls up to one row per year and the list stays scannable.
const MAX_MONTH_ROWS = 24;

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

// Every figure here is a rollup, so it is printed whole. The paise live in the
// transaction table below, which is where anyone checking a specific amount is
// already looking.
export function AccountActivity({ transactions }) {
  const [range, setRange] = useState("6M");

  const periods = useMemo(() => {
    const { months } = RANGES[range];
    const now = new Date();
    const startDate = months ? startOfMonth(subMonths(now, months - 1)) : null;

    const filtered = transactions.filter(
      (transaction) => !startDate || new Date(transaction.date) >= startDate,
    );

    const earliest = filtered.reduce((oldest, transaction) => {
      const date = new Date(transaction.date);
      return !oldest || date < oldest ? date : oldest;
    }, startDate);

    const spanned = earliest
      ? differenceInCalendarMonths(now, earliest) + 1
      : 0;
    const byYear = spanned > MAX_MONTH_ROWS;

    const grouped = filtered.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      // Group on an ISO-ish key, never on the printed label: "Aug" alone would
      // collapse two different years into one row.
      const key = format(date, byYear ? "yyyy" : "yyyy-MM");

      if (!acc[key]) {
        acc[key] = {
          key,
          label: format(date, byYear ? "yyyy" : "MMM yyyy"),
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

    // Newest first — the month you are living in is the one you came to read.
    return Object.values(grouped).sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions, range]);

  const totals = periods.reduce(
    (acc, period) => ({
      income: acc.income + period.income,
      expense: acc.expense + period.expense,
    }),
    { income: 0, expense: 0 },
  );

  const net = totals.income - totals.expense;

  // Bars are scaled against the single largest figure on screen, so the rows
  // are comparable with each other rather than each one filling its own track.
  const scale = periods.reduce(
    (max, period) => Math.max(max, period.income, period.expense),
    0,
  );

  const stats = [
    {
      id: "income",
      label: "In",
      value: totals.income,
      dot: "bg-positive",
      tone: "text-positive",
      sign: "+",
      Icon: ArrowUpRight,
    },
    {
      id: "expense",
      label: "Out",
      value: totals.expense,
      dot: "bg-destructive",
      tone: "text-destructive",
      sign: "-",
      Icon: ArrowDownRight,
    },
    {
      id: "net",
      label: "Net",
      value: Math.abs(net),
      dot: "bg-muted-foreground",
      tone: net > 0 ? "text-positive" : net < 0 ? "text-destructive" : "",
      sign: net > 0 ? "+" : net < 0 ? "-" : "",
      Icon: net > 0 ? ArrowUpRight : net < 0 ? ArrowDownRight : Minus,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h4 font-bold tracking-tight">
          Money in and out
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Range chips live on their own row rather than in CardAction: three
            44px targets beside a title still crowd a 320px card. */}
        <div role="group" aria-label="Date range" className="flex gap-1.5">
          {Object.entries(RANGES).map(([key, { label, full }]) => (
            <button
              key={key}
              type="button"
              aria-pressed={range === key}
              aria-label={full}
              onClick={() => setRange(key)}
              className={cn(
                "text-label font-heading focus-visible:ring-ring ease-standard inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-xs border px-3 font-bold tracking-[.13em] uppercase transition-colors duration-(--animate-duration-fast) focus-visible:ring-2 focus-visible:outline-none md:h-8 md:min-w-0",
                range === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Receipt lines below lg, stat cards at lg. */}
        <dl className="lg:grid lg:grid-cols-3 lg:gap-3">
          {stats.map(({ id, label, value, dot, tone, sign, Icon }) => (
            <div
              key={id}
              className="border-border flex items-baseline justify-between gap-3 border-b py-2.5 last:border-0 lg:block lg:rounded-md lg:border lg:px-4 lg:py-3.5 lg:last:border"
            >
              <dt className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn("size-2.5 shrink-0 rounded-full", dot)}
                />
                <span className={LABEL}>{label}</span>
              </dt>
              <dd
                className={cn(
                  "text-money lg:text-money-lg font-heading flex items-center gap-1 font-semibold tabular-nums lg:mt-2 lg:font-extrabold",
                  tone,
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {sign}
                {formatCurrencyWhole(value)}
              </dd>
            </div>
          ))}
        </dl>

        {periods.length === 0 ? (
          <p className="text-body text-muted-foreground py-4">
            Nothing in this range. Try a wider one.
          </p>
        ) : (
          <ul className="border-border border-t">
            {periods.map((period) => {
              const periodNet = period.income - period.expense;

              return (
                <li
                  key={period.key}
                  className="border-border border-b py-4 last:border-0"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={LABEL}>{period.label}</p>

                    <p
                      className={cn(
                        "text-money font-heading font-semibold tabular-nums",
                        periodNet > 0
                          ? "text-positive"
                          : periodNet < 0
                            ? "text-destructive"
                            : "",
                      )}
                    >
                      {periodNet > 0 ? "+" : periodNet < 0 ? "-" : ""}
                      {formatCurrencyWhole(Math.abs(periodNet))}
                    </p>
                  </div>

                  {/* Two proportional bars. The word, the amount and the bar all
                      say the same thing, so a grayscale screenshot still reads
                      and nothing is hidden behind a hover. */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`${LABEL} w-7 shrink-0`}>In</span>
                      <span className="bg-muted h-1.5 flex-1 rounded-xs">
                        <span
                          aria-hidden="true"
                          className="bg-positive block h-full rounded-xs"
                          style={{ width: `${(period.income / scale) * 100}%` }}
                        />
                      </span>
                      <span className="text-body-sm text-ink-body shrink-0 tabular-nums">
                        {formatCurrencyWhole(period.income)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`${LABEL} w-7 shrink-0`}>Out</span>
                      <span className="bg-muted h-1.5 flex-1 rounded-xs">
                        <span
                          aria-hidden="true"
                          className="bg-destructive block h-full rounded-xs"
                          style={{
                            width: `${(period.expense / scale) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="text-body-sm text-ink-body shrink-0 tabular-nums">
                        {formatCurrencyWhole(period.expense)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

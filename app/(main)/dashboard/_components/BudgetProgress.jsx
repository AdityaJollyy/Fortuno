"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import { updateBudget } from "@/actions/budget";
import { formatCurrency } from "@/lib/format";

import { CountUp } from "@/components/CountUp";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export function BudgetProgress({
  initialBudget,
  currentExpenses,
  accountName,
}) {
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

  // Pace: how far through the budget you are against how far through the month.
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const monthProgress = (now.getDate() / daysInMonth) * 100;

  const pace =
    percentUsed >= 100
      ? "Over budget"
      : percentUsed > monthProgress
        ? "Ahead of pace"
        : "On pace";

  // <80% primary · ≥80% highlight · ≥100% destructive, through the Progress
  // component's own extraStyles prop — never a [&_[data-slot=…]] selector.
  const tone =
    percentUsed >= 100
      ? "bg-destructive"
      : percentUsed >= 80
        ? "bg-highlight"
        : "bg-primary";

  // The tear must be a SIBLING of the card, not a child. `.receipt-edge` paints
  // itself in --card and punches holes; inside a bg-card parent those holes just
  // reveal more card and the scallops vanish. Out here they show the page.
  // Card's ring is off and three borders are on: a bottom hairline would draw
  // straight across the tear edge and undo it.
  return (
    <div>
      <Card className="border-border rounded-b-none border-x border-t ring-0">
        <CardContent className="space-y-5">
          <p className={LABEL}>
            {format(now, "MMMM yyyy")}
            {accountName ? ` · ${accountName}` : ""}
          </p>

          {initialBudget ? (
            <>
              <dl className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className={LABEL}>Budget</dt>
                  <dd className="text-money font-heading text-ink-body font-semibold tabular-nums">
                    {formatCurrency(initialBudget.amount)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className={LABEL}>Spent</dt>
                  <dd className="text-money font-heading text-ink-body font-semibold tabular-nums">
                    {formatCurrency(currentExpenses)}
                  </dd>
                </div>
                <div className="border-border flex items-baseline justify-between gap-4 border-t pt-4">
                  <dt className={LABEL}>Left</dt>
                  <dd className="text-money-lg font-heading text-foreground font-extrabold tabular-nums">
                    <CountUp value={initialBudget.amount - currentExpenses} />
                  </dd>
                </div>
              </dl>

              <Progress
                value={Math.min(percentUsed, 100)}
                extraStyles={tone}
                aria-label={`${Math.round(percentUsed)} percent of this month's budget spent`}
              />
            </>
          ) : (
            <p className="text-body text-ink-body max-w-prose">
              No budget set. Pick one monthly number — Fortuno counts the
              default account against it and tells you the pace.
            </p>
          )}

          {isEditing ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="text"
                inputMode="decimal"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-36"
                placeholder="Enter amount"
                autoFocus
                disabled={loading}
                aria-label="Monthly budget amount"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUpdateBudget}
                disabled={loading}
                aria-label="Save budget"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="text-positive size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={loading}
                aria-label="Cancel"
              >
                <X className="text-destructive size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={LABEL}>
                {initialBudget
                  ? `${Math.round(percentUsed)}% spent · ${pace} · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
                  : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in ${format(now, "MMMM")}`}
              </p>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil aria-hidden="true" />
                {initialBudget ? "Edit" : "Set budget"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* The tear-off edge. A sibling of the card, so the punched holes fall on
          the page background and actually read as perforations. */}
      <div className="receipt-edge" aria-hidden="true" />
    </div>
  );
}

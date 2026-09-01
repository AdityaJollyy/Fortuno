"use client";

import { Loader2, Trash } from "lucide-react";

import { formatCurrencyWhole } from "@/lib/format";

import { Button } from "@/components/ui/button";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export function BulkActionBar({
  count,
  total,
  matchingCount,
  maxSelectable,
  onSelectAllMatching,
  onClear,
  onDelete,
  deleting,
}) {
  const overCap = count > maxSelectable;

  return (
    <div className="sticky bottom-4 z-30">
      <div className="bg-popover border-border shadow-float animate-in slide-in-from-bottom-4 ease-out-soft flex flex-wrap items-center gap-3 rounded-md border p-3 duration-(--animate-duration-base)">
        <div className="min-w-0 flex-1">
          <p className={LABEL}>{count} selected · total</p>
          <p className="text-money font-heading text-foreground font-semibold tabular-nums">
            {formatCurrencyWhole(total)}
          </p>
        </div>

        {count < matchingCount && (
          <Button variant="ghost" onClick={onSelectAllMatching}>
            Select all {matchingCount}
          </Button>
        )}

        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>

        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={deleting || overCap}
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash className="size-4" aria-hidden="true" />
          )}
          Delete {count}
        </Button>

        {/* The cap is the action's own limit. Saying so beats letting the
            server reject the request after the user commits to it. */}
        {overCap && (
          <p
            role="alert"
            className="text-destructive w-full text-sm"
          >{`Select at most ${maxSelectable} transactions to delete at once.`}</p>
        )}
      </div>
    </div>
  );
}

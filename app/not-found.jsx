import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-22 pb-11 md:px-6 md:pt-26">
      <div className="w-full max-w-md">
        <div className="bg-card border-border shadow-paper rounded-t-md border-x border-t p-5 md:p-6">
          <p className={LABEL}>Void · No such page</p>

          <p className="text-display-lg font-heading text-foreground mt-4 font-extrabold tabular-nums">
            404
          </p>

          <div className="border-border mt-5 flex items-baseline justify-between gap-4 border-t pt-4">
            <span className={LABEL}>Total</span>
            <span className="text-money font-heading text-ink-body font-semibold tabular-nums">
              {formatCurrency(0)}
            </span>
          </div>

          <h1 className="text-h3 font-heading text-foreground mt-7 font-extrabold tracking-tight">
            This page isn&apos;t on the receipt.
          </h1>

          <p className="text-body text-ink-body mt-2">
            The link may be old, or we moved it. Your accounts and transactions
            are untouched.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              className="px-5"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
            <Button
              variant="outline"
              className="px-5"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Back to home
            </Button>
          </div>
        </div>

        <div className="receipt-edge" />
      </div>
    </div>
  );
}

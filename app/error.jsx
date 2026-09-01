"use client";

import { Button } from "@/components/ui/button";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

// Never renders error.message — Next masks it in production anyway, and the
// digest is the only thing that lets a human find the real trace.
export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 pt-22 pb-11 md:px-6 md:pt-26">
      <div className="w-full max-w-md">
        <div className="bg-card border-border shadow-paper rounded-t-md border-x border-t p-5 md:p-6">
          <p className={`${LABEL} text-destructive`}>Void · Not printed</p>

          <h1 className="text-h3 font-heading text-foreground mt-4 font-extrabold tracking-tight">
            Something went wrong.
          </h1>

          <p className="text-body text-ink-body mt-2">
            We could not load this page. Nothing was changed — try again, and if
            it keeps happening, quote the reference below.
          </p>

          {error.digest && (
            <div className="border-border mt-5 flex items-baseline justify-between gap-4 border-t pt-4">
              <span className={LABEL}>Reference</span>
              <span className="text-body-sm font-heading text-ink-body font-semibold tabular-nums">
                {error.digest}
              </span>
            </div>
          )}

          <Button className="mt-7 px-5" onClick={reset}>
            Try again
          </Button>
        </div>

        <div className="receipt-edge" />
      </div>
    </div>
  );
}

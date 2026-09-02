import Link from "next/link";

import { trustPoints } from "@/data/landing";
import { formatCurrency } from "@/lib/format";
import { CountUp } from "@/components/CountUp";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NavSpinner } from "./NavSpinner";

// A drawn sample, not a real account. Static on purpose — and deliberately
// undated: this page is prerendered, so a `new Date()` here would bake the
// build month into the HTML and go stale on the first of the next month.
const SAMPLE_BUDGET = 60000;
const SAMPLE_SPENT = 41820;
const SAMPLE_LEFT = SAMPLE_BUDGET - SAMPLE_SPENT;
const SAMPLE_PERCENT = Math.round((SAMPLE_SPENT / SAMPLE_BUDGET) * 100);

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

// The dotted leader between a receipt row's label and its figure.
const LEADER = "border-input flex-1 border-b border-dotted";

// No data-reveal on this section: it is the first paint, and starting it at
// opacity 0 until hydration is a visible flash and a worse LCP.
const HeroSection = () => {
  return (
    <section className="grid items-center gap-10 py-4 md:py-8 lg:grid-cols-[1fr_400px] lg:gap-14 xl:grid-cols-[1fr_440px] xl:gap-20">
      <div>
        <p className={LABEL}>For people who aren&apos;t accountants</p>

        <h1 className="text-h1 xl:text-display-lg font-heading text-foreground mt-4 font-extrabold tracking-tight text-balance">
          Three questions.
          <br />
          One screen.
        </h1>

        <p className="text-body text-ink-body mt-5 max-w-prose">
          How much do I have, am I overspending this month, and where did it go.
          Fortuno answers all three the second you open it — no dashboards to
          configure, no charts you have to learn to read.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="px-6"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Start — it&apos;s free
            <NavSpinner />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="px-6"
            nativeButton={false}
            render={<a href="#how" />}
          >
            See how it works
          </Button>
        </div>

        {/* The three facts that used to take up a full-width band. */}
        <ul
          className={`${LABEL} text-ink-faint mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1.5`}
        >
          {trustPoints.map((point, index) => (
            <li key={point} className="flex items-center gap-2.5">
              {index > 0 && <span aria-hidden="true">·</span>}
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Sample budget receipt — the thing the whole app is about, printed and
          torn off. This is the one paper object on the desk.

          The tear is a SIBLING of the card, never a child: `.receipt-edge`
          paints itself in --card and punches holes through itself, so inside a
          bg-card parent the holes reveal more card and the scallops disappear.
          Out here they fall on the page and read as perforations. */}
      <div>
        <div className="bg-card border-border shadow-lift rounded-t-md border-x border-t p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className={LABEL}>This month</p>
            <p className={LABEL}>Sample</p>
          </div>

          <dl className="mt-6 space-y-3.5">
            <div className="flex items-baseline gap-3">
              <dt className={LABEL}>Budget</dt>
              <span aria-hidden="true" className={LEADER} />
              <dd className="text-money font-heading text-ink-body font-semibold tabular-nums">
                {formatCurrency(SAMPLE_BUDGET)}
              </dd>
            </div>

            <div className="flex items-baseline gap-3">
              <dt className={LABEL}>Spent</dt>
              <span aria-hidden="true" className={LEADER} />
              <dd className="text-money font-heading text-ink-body font-semibold tabular-nums">
                {formatCurrency(SAMPLE_SPENT)}
              </dd>
            </div>

            <div className="border-border flex items-baseline justify-between gap-4 border-t pt-4">
              <dt className={LABEL}>Left</dt>
              <dd className="text-money-xl font-heading text-foreground font-extrabold tabular-nums">
                <CountUp value={SAMPLE_LEFT} />
              </dd>
            </div>
          </dl>

          <Progress
            value={SAMPLE_PERCENT}
            aria-label={`${SAMPLE_PERCENT} percent of the sample budget spent`}
            className="mt-6"
          />

          <p className={`${LABEL} mt-3`}>{SAMPLE_PERCENT}% spent · On pace</p>
        </div>

        <div className="receipt-edge" aria-hidden="true" />
      </div>
    </section>
  );
};

export default HeroSection;

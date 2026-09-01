import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

const CTASection = () => {
  return (
    <section data-reveal className="py-12 md:py-20">
      <div className="mx-auto max-w-lg text-center">
        <p className={LABEL}>The bottom line</p>

        <h2 className="text-h2 font-heading text-foreground mt-3 font-extrabold tracking-tight text-balance">
          Start with this month.
        </h2>

        <p className="text-body text-ink-body mt-3">
          One account, one number. You&apos;ll know where you stand before the
          31st.
        </p>

        <Button
          size="lg"
          className="mt-7 px-6"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          Create your account
        </Button>
      </div>
    </section>
  );
};

export default CTASection;

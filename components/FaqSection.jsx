import { ChevronDown } from "lucide-react";

import { faqData } from "@/data/landing";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

// Native <details>: keyboard handling, screen-reader semantics and the open
// state come for free, so this stays a server component and ships no JS.
const FaqSection = () => {
  return (
    <section
      id="faq"
      data-reveal
      className="py-12 md:py-20 lg:grid lg:grid-cols-12 lg:gap-12"
    >
      <div className="lg:col-span-4">
        <p className={LABEL}>Before you sign up</p>

        <h2 className="text-h2 font-heading text-foreground mt-3 font-extrabold tracking-tight">
          Fair questions
        </h2>

        <p className="text-body text-ink-body mt-3 max-w-prose">
          The things worth knowing before you put a month of spending into it.
        </p>
      </div>

      <div className="mt-8 lg:col-span-8 lg:mt-0">
        {faqData.map((item) => (
          <details
            key={item.id}
            className="group border-border border-b last:border-0"
          >
            <summary className="text-h4 font-heading text-foreground hover:text-primary focus-visible:ring-ring/50 ease-standard flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bold transition-colors duration-(--animate-duration-fast) outline-none focus-visible:ring-3 [&::-webkit-details-marker]:hidden">
              {item.question}

              <ChevronDown
                className="text-ink-faint ease-standard size-4 shrink-0 transition-transform duration-(--animate-duration-base) group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <p className="text-body text-ink-body max-w-prose pb-5">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;

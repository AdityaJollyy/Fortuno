import { howItWorksData } from "@/data/landing";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

const HowItWorks = () => {
  return (
    <section id="how" data-reveal className="py-12 md:py-20">
      <p className={LABEL}>Three steps</p>

      <h2 className="text-h2 font-heading text-foreground mt-3 font-extrabold tracking-tight">
        Getting started
      </h2>

      {/* The dashed top rule runs across all three, so the row reads as one
          perforated strip rather than three unrelated cards. */}
      <ol className="mt-9 grid gap-8 md:mt-11 md:grid-cols-3 md:gap-10">
        {howItWorksData.map((step) => (
          <li
            key={step.id}
            className="border-input border-t border-dashed pt-5"
          >
            <span className="text-label font-heading text-muted-foreground bg-muted border-border flex size-8 items-center justify-center rounded-full border font-bold tabular-nums">
              {step.step}
            </span>

            <h3 className="text-h4 font-heading text-foreground mt-4 font-bold">
              {step.title}
            </h3>

            <p className="text-body text-ink-body mt-2 max-w-prose">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default HowItWorks;

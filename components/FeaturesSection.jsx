import { featuresData } from "@/data/landing";

const LABEL =
  "text-label font-heading font-bold tracking-[.13em] uppercase text-muted-foreground";

const FeaturesSection = () => {
  return (
    <section
      id="features"
      data-reveal
      className="py-12 md:py-20 lg:grid lg:grid-cols-12 lg:gap-12"
    >
      <div className="lg:col-span-4">
        <p className={LABEL}>Items</p>

        <h2 className="text-h2 font-heading text-foreground mt-3 font-extrabold tracking-tight">
          What it does
        </h2>

        <p className="text-body text-ink-body mt-3 max-w-prose">
          Four things, and nothing you have to set up before they work.
        </p>
      </div>

      {/* Line items, not cards: the rule between them is the whole device. */}
      <ul className="mt-8 lg:col-span-8 lg:mt-0">
        {featuresData.map((feature) => {
          const Icon = feature.icon;

          return (
            <li
              key={feature.id}
              className="border-border flex gap-4 border-b py-6 first:pt-0 last:border-0 last:pb-0"
            >
              <span className="bg-muted border-border text-ink-faint flex size-9 shrink-0 items-center justify-center rounded-xs border">
                <Icon className="size-4" aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <h3 className="text-h4 font-heading text-foreground font-bold">
                  {feature.title}
                </h3>

                <p className="text-body text-ink-body mt-1.5 max-w-prose">
                  {feature.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FeaturesSection;

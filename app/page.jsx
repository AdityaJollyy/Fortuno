import { Reveal } from "@/components/Reveal";
import CTASection from "@/components/CTASection";
import FaqSection from "@/components/FaqSection";
import FeaturesSection from "@/components/FeaturesSection";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";

// The ticket notch between sections. Negative inline margins pull it out to the
// card's edges so the two punched circles straddle them.
const NOTCH = "notch-rule -mx-5 md:-mx-10";

export default function Home() {
  return (
    <div className="max-w-page mx-auto w-full px-5 pt-22 pb-14 md:px-8 md:pt-26 md:pb-20">
      {/* One observer for every [data-reveal] section below. Renders nothing. */}
      <Reveal />

      {/* The desk: the hero sits on the page itself, so the fold is not one
          large flat box. The only paper object up here is the sample receipt. */}
      <HeroSection />

      {/* …and the receipt it prints, which tears off above the footer. */}
      <div className="bg-card border-border shadow-paper mt-14 rounded-t-md border-x border-t px-5 md:mt-20 md:px-10">
        <FeaturesSection />

        <div className={NOTCH} />
        <HowItWorks />

        <div className={NOTCH} />
        <FaqSection />

        <div className={NOTCH} />
        <CTASection />
      </div>

      <div className="receipt-edge" />
    </div>
  );
}

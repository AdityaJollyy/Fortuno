import CTASection from "@/components/CTASection";
import FeaturesSection from "@/components/FeaturesSection";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import StatsSection from "@/components/StatsSection";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <Testimonials />
      <CTASection />
    </main>
  );
}

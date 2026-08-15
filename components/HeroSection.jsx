import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="px-4 pt-40 pb-20">
      <div className="container mx-auto text-center">
        <h1 className="gradient gradient-title pb-6 text-5xl md:text-8xl lg:text-[105px]">
          Manage Your Finances <br /> with Intelligence
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
          An AI-powered financial management platform that helps you track,
          analyze, and optimize your spending with real-time insights.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href="https://www.youtube.com/">
            <Button size="lg" variant="outline" className="px-8">
              Watch Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

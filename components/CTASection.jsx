import { Button } from "@/components/ui/button";
import Link from "next/link";

const CTASection = () => {
  return (
    <section className="bg-blue-600 py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">
          Ready to Take Control of Your Finances?
        </h2>

        <p className="mx-auto mb-8 max-w-2xl text-blue-100">
          Join thousands of users who are already managing their finances
          smarter with Fortuno.
        </p>

        <Link href="/dashboard">
          <Button
            size="lg"
            className="animate-bounce bg-white text-blue-600 hover:bg-blue-50"
          >
            Start Free Trial
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;

import { howItWorksData } from "@/data/landing";

const HowItWorks = () => {
  return (
    <section className="bg-blue-50 py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold">How It Works</h2>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {howItWorksData.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.id} className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>

                <h3 className="mb-4 text-xl font-semibold">
                  {step.step}. {step.title}
                </h3>

                <p className="text-gray-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

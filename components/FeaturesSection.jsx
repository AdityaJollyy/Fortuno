import { Card, CardContent } from "@/components/ui/card";
import { featuresData } from "@/data/landing";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Everything you need to manage your finances
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.id} className="p-6">
                <CardContent className="space-y-4 pt-4">
                  <Icon className="h-8 w-8 text-blue-600" />

                  <h3 className="text-xl font-semibold">{feature.title}</h3>

                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

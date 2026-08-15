import { statsData } from "@/data/landing";

const StatsSection = () => {
  return (
    <section className="bg-blue-50 py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {statsData.map((stat) => (
            <div key={stat.id} className="text-center">
              <div className="mb-2 text-4xl font-bold text-blue-600">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

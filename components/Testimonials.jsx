import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { testimonialsData } from "@/data/landing";

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold">
          What Our Users Say
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonialsData.map((testimonial) => (
            <Card key={testimonial.id} className="p-6">
              <CardContent className="pt-4">
                <div className="mb-4 flex items-center">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />

                  <div className="ml-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600">{testimonial.quote}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

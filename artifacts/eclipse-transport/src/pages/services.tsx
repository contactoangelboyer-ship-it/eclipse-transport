import { Layout } from "@/components/layout/Layout";
import { useListServices } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Plane, Briefcase, Glasses, Music, Ticket, Clock, MapPin, Heart, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, any> = {
  Plane,
  Briefcase,
  Heart,
  Glasses,
  Music,
  Trophy,
  Clock,
  MapPin,
  Ticket
};

export default function Services() {
  const { data: services, isLoading } = useListServices();

  return (
    <Layout>
      <div className="bg-background min-h-screen pt-12 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Tailored transportation solutions for every occasion. Experience the pinnacle of comfort, reliability, and discretion in Los Angeles.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card border border-border h-64 animate-pulse rounded-sm"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.map((service, index) => {
                const IconComponent = service.icon && iconMap[service.icon] ? iconMap[service.icon] : MapPin;
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-card border border-border p-8 flex flex-col hover:border-primary/50 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary border border-border mb-6 group-hover:scale-110 transition-transform">
                      <IconComponent size={20} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{service.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                      {service.description}
                    </p>
                    <ul className="space-y-2 mb-8">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <Link 
                      href={`/book?service=${service.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors mt-auto"
                    >
                      Book This Service <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout/Layout";
import { useListFleet } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Users, Briefcase, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Fleet() {
  const { data: fleet, isLoading } = useListFleet();

  return (
    <Layout>
      <div className="bg-background min-h-screen pt-12 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Fleet</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Meticulously maintained and appointed for maximum comfort. Choose the perfect vehicle for your journey.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border h-96 animate-pulse rounded-sm"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {fleet?.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center bg-card border border-border p-6 md:p-10 rounded-sm"
                >
                  <div className="relative aspect-[16/10] bg-background border border-border/50 rounded-sm overflow-hidden flex items-center justify-center">
                    {/* Placeholder for vehicle image with aesthetic treatment */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-background to-background/50 z-10"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 bg-gradient-to-r from-transparent via-primary/10 to-transparent rotate-[-10deg] blur-2xl"></div>
                    <span className="text-foreground/20 font-serif italic text-6xl tracking-widest relative z-20 mix-blend-overlay">
                      {vehicle.model.split(' ')[0]}
                    </span>
                    <div className="absolute bottom-4 left-4 z-20">
                      <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-background/80 backdrop-blur px-3 py-1 border border-primary/20">
                        {vehicle.category}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{vehicle.name}</h2>
                    <h3 className="text-lg text-muted-foreground mb-6">{vehicle.model}</h3>
                    
                    <div className="flex gap-6 mb-8 pb-8 border-b border-border">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Users size={18} className="text-primary" />
                        <span>Up to {vehicle.maxPassengers}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Briefcase size={18} className="text-primary" />
                        <span>Up to {vehicle.maxLuggage} bags</span>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Amenities</h4>
                      <ul className="grid grid-cols-2 gap-3">
                        {vehicle.amenities.map((amenity, idx) => (
                          <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span> {amenity}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Starting at</span>
                        <span className="text-2xl font-bold">${vehicle.hourlyRate}<span className="text-base font-normal text-muted-foreground">/hr</span></span>
                      </div>
                      <Link 
                        href={`/book?vehicle=${vehicle.id}`}
                        className="bg-primary text-primary-foreground px-8 py-3 text-center text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 sm:ml-auto"
                      >
                        Reserve {vehicle.name} <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Star, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90dvh] flex items-center pt-10 pb-20 overflow-hidden">
        {/* Abstract dark luxury background */}
        <div className="absolute inset-0 bg-background z-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-background via-background to-primary/10 opacity-60"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
              Arrive with <br/>
              <span className="text-primary italic font-serif font-light pr-2">unhurried</span> 
              <br/> elegance.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Premium black car service in Los Angeles. Discretion, punctuality, and uncompromising comfort for the modern executive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/book" 
                className="bg-primary text-primary-foreground px-8 py-4 text-center font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                data-testid="hero-book-now"
              >
                Reserve Your Ride <ArrowRight size={18} />
              </Link>
              <Link 
                href="/fleet" 
                className="border border-border bg-card/50 backdrop-blur px-8 py-4 text-center font-semibold uppercase tracking-wider hover:bg-card transition-colors"
                data-testid="hero-view-fleet"
              >
                Explore Fleet
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden md:block relative h-[600px] w-full rounded-sm overflow-hidden border border-border/50 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10"></div>
            {/* Visual placeholder for a luxury car */}
            <div className="w-full h-full bg-card flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5"></div>
               <div className="absolute top-1/4 -left-1/4 w-[150%] h-1/2 bg-gradient-to-r from-transparent via-primary/10 to-transparent rotate-[-15deg] blur-2xl"></div>
               <span className="text-muted-foreground/30 font-serif italic text-4xl tracking-widest relative z-10">Eclipse</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Service Strip */}
      <section className="bg-card border-y border-border py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary shrink-0 border border-border">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Uncompromising Safety</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Impeccably maintained vehicles and rigorously vetted professional chauffeurs.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary shrink-0 border border-border">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Always Punctual</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Flight tracking and predictive routing ensures we are there before you step out.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary shrink-0 border border-border">
                <Star size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">White-Glove Service</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Discreet, silent, and anticipatory service tailored to your exact preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">Our Services</h2>
              <h3 className="text-3xl md:text-4xl font-bold">Tailored to your itinerary.</h3>
            </div>
            <Link href="/services" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              View All Services <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Airport Transfers", desc: "Seamless arrivals and departures from LAX, BUR, and private FBOs." },
              { title: "Corporate Travel", desc: "Reliable, comfortable transportation for executives and roadshows." },
              { title: "Special Events", desc: "Elegant arrivals for weddings, galas, and red carpet events." }
            ].map((service, i) => (
              <div key={i} className="group relative bg-card border border-border p-8 hover:border-primary/50 transition-colors overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0 transition-transform group-hover:scale-110"></div>
                <h4 className="text-xl font-bold mb-4 relative z-10">{service.title}</h4>
                <p className="text-muted-foreground leading-relaxed mb-8 relative z-10">{service.desc}</p>
                <Link href="/book" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-primary/80 transition-colors relative z-10">
                  Book Now <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

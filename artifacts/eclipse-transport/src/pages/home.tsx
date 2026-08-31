import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { ArrowRight, Clock, ShieldCheck, Star } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";

import heroImg from "@assets/generated_images/hero-la-street.jpg";
import fleetPreviewImg from "@assets/generated_images/fleet-preview.jpg";

const HERO_PHRASES = [
  "A promise of arrival.",
  "Your driver is already there.",
  "Unhurried. Unnoticed. On time.",
  "Where discretion meets precision.",
  "The quiet art of getting there.",
  "Los Angeles, without the wait.",
];

function RotatingTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_PHRASES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden" style={{ minHeight: "2.3em" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="block"
        >
          {HERO_PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  useSEO({
    title: "Luxury Private Car Service in Los Angeles",
    description: "Eclipse Transport — Premium black car service in Los Angeles. Airport transfers to LAX, BUR, LGB & SNA. Corporate travel, weddings, proms & events. Cadillac Escalade, Chevrolet Suburban & Lincoln Continental. Professional chauffeurs available 24/7.",
    keywords: "luxury car service Los Angeles, private driver LA, limo service LAX, airport transfer Los Angeles, black car service LA, chauffeur service Los Angeles, Escalade limo LA, corporate transportation Los Angeles",
    canonical: "https://eclipsetransportla.com/",
  });

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[100dvh] w-full flex flex-col lg:flex-row overflow-hidden bg-[#FCFBF8]">
        <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 pt-36 md:pt-36 pb-16 z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[6.5rem] font-light tracking-tight text-[#1A1A1A] leading-[1.05] mb-6 md:mb-8"
          >
            <RotatingTitle />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base md:text-xl text-[#1A1A1A]/70 max-w-lg mb-10 md:mb-12 font-light tracking-wide leading-relaxed"
          >
            Private ground transportation in Los Angeles. The silent, unhurried presence that appears at your door.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/book" className="inline-flex h-14 items-center justify-center bg-[#1A1A1A] text-white px-10 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-black transition-all hover:scale-105 shadow-md active:scale-95">
              Book a vehicle
            </Link>
            <Link href="/services" className="inline-flex h-14 items-center justify-center border border-[#1A1A1A]/20 text-[#1A1A1A] px-10 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:border-[#1A1A1A] transition-all active:scale-95">
              View Services
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center gap-4 sm:gap-6 mt-10 md:mt-12 pt-8 md:pt-10 border-t border-black/5"
          >
            {[
              { icon: <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />, label: "Background-checked drivers" },
              { icon: <Clock className="w-4 h-4" strokeWidth={1.5} />, label: "On-time guarantee" },
              { icon: <Star className="w-4 h-4" strokeWidth={1.5} />, label: "5-star rated" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[#1A1A1A]/50 text-xs font-medium">
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="w-full lg:w-[45%] h-[60vh] lg:h-auto relative overflow-hidden hidden lg:block">
          <motion.img
            style={{ y }}
            src={heroImg}
            alt="Los Angeles Luxury Transport"
            className="absolute inset-0 w-full h-[120%] object-cover object-center"
          />
          {/* Floating stat cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="absolute bottom-12 left-8 bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/50"
          >
            <p className="text-2xl font-light text-[#1A1A1A]">5,000+</p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50 mt-1">Rides completed</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="absolute top-20 right-8 bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/50"
          >
            <p className="text-2xl font-light text-[#1A1A1A]">4.9 ★</p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50 mt-1">Average rating</p>
          </motion.div>
        </div>
        {/* Mobile image fallback */}
        <div className="w-full h-[45vh] lg:hidden relative overflow-hidden mt-auto">
          <img
            src={heroImg}
            alt="Los Angeles Luxury Transport"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute bottom-4 left-4 right-4 flex gap-3">
            <div className="flex-1 bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 text-center shadow-md">
              <p className="text-lg font-light text-[#1A1A1A]">5,000+</p>
              <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/50">Rides</p>
            </div>
            <div className="flex-1 bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 text-center shadow-md">
              <p className="text-lg font-light text-[#1A1A1A]">4.9 ★</p>
              <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/50">Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-32 bg-white border-b border-black/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-8">The Eclipse Standard</h2>
            <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1A1A1A] tracking-tight">
              We operate in the gap between a town car and a private jet. Reliable, refined, understated confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Fleet Preview Section */}
      <section className="py-0">
        <div className="flex flex-col lg:flex-row min-h-[70vh]">
          <div className="w-full lg:w-1/2 bg-[#FCFBF8] flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-6">The Fleet</h2>
            <h3 className="text-4xl md:text-5xl font-light mb-8 tracking-tight text-[#1A1A1A] leading-tight">Vehicles chosen for silence, not show.</h3>
            <p className="text-[#1A1A1A]/60 mb-10 max-w-lg leading-relaxed font-light text-lg">
              Our fleet is curated for comfort and discretion — Chevrolet Suburbans, Cadillac Escalades, Lincoln Continentals, and Mercedes S-Class sedans.
            </p>
            <Link href="/fleet" className="inline-flex h-14 w-fit items-center justify-center border border-[#1A1A1A] text-[#1A1A1A] px-10 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">
              View Fleet <ArrowRight className="w-4 h-4 ml-3" />
            </Link>
          </div>
          <div className="w-full lg:w-1/2 h-[50vh] lg:h-auto overflow-hidden">
            <img src={fleetPreviewImg} alt="Eclipse Fleet" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-6">The Process</h2>
            <h3 className="text-4xl md:text-5xl font-light tracking-tight text-[#1A1A1A]">Three steps to your ride</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-[1px] bg-black/5" />
            {[
              { n: 1, title: "Choose Your Service", body: "Select your trip type and route. Airport transfers, hourly, point-to-point, or events." },
              { n: 2, title: "We Assign Your Chauffeur", body: "Our dispatch matches you with the right driver and vehicle. You get a confirmation in minutes." },
              { n: 3, title: "Arrive in Style", body: "Your driver will be waiting before you're ready. Sit back and enjoy the journey." },
            ].map((item) => (
              <div key={item.n} className="text-center relative z-10">
                <div className="w-16 h-16 bg-[#1A1A1A] text-white shadow-md rounded-full flex items-center justify-center mx-auto mb-8 text-xl font-light">
                  {item.n}
                </div>
                <h4 className="text-xl font-medium mb-3 text-[#1A1A1A]">{item.title}</h4>
                <p className="text-[#1A1A1A]/60 text-sm font-light leading-relaxed px-4">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsCarousel />

      {/* Service Areas Strip */}
      <section className="py-16 bg-[#1A1A1A] overflow-hidden" data-testid="section-areas">
        <div className="container mx-auto px-6 text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">We serve all of greater Los Angeles</p>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex gap-4 md:gap-8 items-center py-4">
            {["LAX", "Beverly Hills", "Santa Monica", "Malibu", "Hollywood", "Downtown LA", "Pasadena", "Burbank", "Long Beach", "West Hollywood", "Glendale", "Culver City", "Inglewood", "El Segundo", "Torrance", "Orange County"].map((area, i) => (
              <span key={i} className="inline-block px-6 py-3 bg-white/10 rounded-full text-white text-sm font-medium tracking-wide border border-white/5 whitespace-nowrap">
                {area}
              </span>
            ))}
            {["LAX", "Beverly Hills", "Santa Monica", "Malibu", "Hollywood", "Downtown LA", "Pasadena", "Burbank", "Long Beach", "West Hollywood", "Glendale", "Culver City", "Inglewood", "El Segundo", "Torrance", "Orange County"].map((area, i) => (
              <span key={`dup-${i}`} className="inline-block px-6 py-3 bg-white/10 rounded-full text-white text-sm font-medium tracking-wide border border-white/5 whitespace-nowrap">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="py-24 bg-white text-center border-t border-black/5">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light mb-10 text-[#1A1A1A] tracking-tight">Ready for your journey?</h2>
          <Link href="/book" className="inline-flex h-14 items-center justify-center bg-[#1A1A1A] text-white px-12 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-black transition-all hover:scale-105 shadow-md active:scale-95">
            Reserve Now
          </Link>
        </div>
      </section>
    </Layout>
  );
}

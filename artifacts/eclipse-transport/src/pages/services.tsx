import { useListServices } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import {
  Check, Plane, Briefcase, Calendar, Map, Clock,
  Heart, Music, Trophy, Car, Church, Wind
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import serviceAirport from "@assets/generated_images/service-airport.jpg";
import serviceCorporate from "@assets/generated_images/service-corporate.jpg";
import { useSEO } from "@/hooks/useSEO";

function getServiceIcon(iconName: string, className = "w-6 h-6") {
  switch (iconName?.toLowerCase()) {
    case "airport":     return <Plane    className={className} strokeWidth={1.5} />;
    case "corporate":  return <Briefcase className={className} strokeWidth={1.5} />;
    case "events":     return <Calendar  className={className} strokeWidth={1.5} />;
    case "point":      return <Map       className={className} strokeWidth={1.5} />;
    case "hourly":     return <Clock     className={className} strokeWidth={1.5} />;
    case "date":       return <Heart     className={className} strokeWidth={1.5} />;
    case "concert":    return <Music     className={className} strokeWidth={1.5} />;
    case "sports":     return <Trophy    className={className} strokeWidth={1.5} />;
    case "prom":       return <Car       className={className} strokeWidth={1.5} />;
    case "wedding":    return <Church    className={className} strokeWidth={1.5} />;
    case "air":        return <Wind      className={className} strokeWidth={1.5} />;
    default:           return <Map       className={className} strokeWidth={1.5} />;
  }
}

function getServiceImage(index: number) {
  return index % 2 === 0 ? serviceAirport : serviceCorporate;
}

const STATIC_SERVICES = [
  {
    id: 1,
    name: "Airport Transfer",
    icon: "airport",
    description:
      "Seamless arrivals and departures across all Los Angeles area airports — LAX, BUR, LGB, SNA, and ONT. Your chauffeur tracks your flight in real-time and adjusts for any delays automatically.",
    priceFrom: 85,
    features: [
      "Real-time flight monitoring included",
      "Inside terminal meet & greet available",
      "All LAX terminals & Tom Bradley International",
      "Burbank, Long Beach, Orange County & Ontario",
    ],
  },
  {
    id: 2,
    name: "Corporate Travel",
    icon: "corporate",
    description:
      "Executive transportation built around your schedule. Dedicated corporate accounts with consolidated monthly invoicing, priority dispatch, and a dedicated account manager for roadshows and board travel.",
    priceFrom: 95,
    features: [
      "Consolidated monthly invoicing",
      "Priority dispatch for same-day requests",
      "Executive roadshows & multi-leg itineraries",
      "Absolute discretion & NDA compliance",
    ],
  },
  {
    id: 3,
    name: "Date Night",
    icon: "date",
    description:
      "Treat your loved one to an exclusive, unforgettable black car experience. Whether it's a fine dining reservation, a show on the Sunset Strip, or a private evening drive along the coast.",
    priceFrom: 85,
    features: [
      "Minimum 3-hour evening package",
      "Complimentary chilled water & mints",
      "Red carpet door service",
      "Flexible multiple-stop itinerary",
    ],
  },
  {
    id: 4,
    name: "Prom",
    icon: "prom",
    description:
      "Arrive in style with luxury prom transportation that is elegant, safe, and truly unforgettable. A night this special deserves a ride that matches the occasion.",
    priceFrom: 120,
    features: [
      "Professional licensed chauffeur",
      "Group SUV & sprinter van options",
      "Red carpet arrival experience",
      "Complimentary photos at drop-off",
    ],
  },
  {
    id: 5,
    name: "Concerts & Shows",
    icon: "concert",
    description:
      "Enjoy a stylish ride to and from concerts, plays, or operas — avoiding the hassle of parking and traffic. We handle the logistics so you focus on the experience.",
    priceFrom: 90,
    features: [
      "Drop-off at main venue entrance",
      "Post-show priority pickup",
      "Staples Center, Hollywood Bowl & more",
      "Round-trip packages available",
    ],
  },
  {
    id: 6,
    name: "Sports Events",
    icon: "sports",
    description:
      "Skip the crowded parking lots and long walks by arriving at your sporting event in comfort and style. We cover all major LA venues and stadiums.",
    priceFrom: 90,
    features: [
      "SoFi Stadium, Dodger Stadium & Crypto.com Arena",
      "Tailgate-friendly scheduling",
      "Group vehicle options for larger parties",
      "Round-trip & one-way bookings",
    ],
  },
  {
    id: 7,
    name: "Around Town",
    icon: "point",
    description:
      "Point-to-point rides reserved in advance for any transportation need within Greater Los Angeles. Reliable, discreet, and always on time.",
    priceFrom: 75,
    features: [
      "Beverly Hills, West Hollywood & Downtown",
      "Beach cities & South Bay coverage",
      "Multiple stops welcome",
      "No surge pricing — fixed flat rates",
    ],
  },
  {
    id: 8,
    name: "Wedding",
    icon: "wedding",
    description:
      "Luxury wedding day transportation with professional chauffeurs and elegant vehicles for a flawless, memorable experience. From the ceremony to the reception and beyond.",
    priceFrom: 150,
    features: [
      "Bridal party & guest coordination",
      "Ribbon & floral decoration available",
      "Multi-vehicle fleet for large parties",
      "Champagne on arrival",
    ],
  },
  {
    id: 9,
    name: "By the Hour",
    icon: "hourly",
    description:
      "Maximum flexibility for shopping trips, city meetings, or full-day LA excursions. Your chauffeur stays with you for the duration — waiting, driving, and adjusting to your schedule.",
    priceFrom: 65,
    features: [
      "Minimum 3 hours, up to 12 hours",
      "Shopping trips to Rodeo Drive & The Grove",
      "Beach cities & South Bay excursions",
      "Multiple stops included",
    ],
  },
  {
    id: 10,
    name: "Air Transportation",
    icon: "air",
    description:
      "Access exclusive private flights with seamless ground-to-air luxury travel coordination. We partner with private aviation providers across Southern California.",
    priceFrom: 200,
    features: [
      "Van Nuys Airport, Burbank & Long Beach FBOs",
      "Private jet & charter coordination",
      "Ground-to-tarmac seamless transfer",
      "24/7 dedicated aviation concierge",
    ],
  },
];

const serviceAreas = [
  { title: "LAX Transfers",              icon: <Plane    className="w-5 h-5" strokeWidth={1.5} />, desc: "Private arrivals and departures at Tom Bradley & all terminals." },
  { title: "Corporate Accounts",         icon: <Briefcase className="w-5 h-5" strokeWidth={1.5} />, desc: "Dedicated accounts and roadshows for executives." },
  { title: "Weddings & Galas",           icon: <Church   className="w-5 h-5" strokeWidth={1.5} />, desc: "Multi-vehicle coordination for your most important moments." },
  { title: "Beverly Hills & WeHo",       icon: <Map      className="w-5 h-5" strokeWidth={1.5} />, desc: "Rodeo Drive, Sunset Strip, and Melrose — core coverage." },
  { title: "Concerts & Sports",          icon: <Music    className="w-5 h-5" strokeWidth={1.5} />, desc: "SoFi Stadium, Hollywood Bowl, Dodger Stadium & more." },
  { title: "Private Aviation",           icon: <Wind     className="w-5 h-5" strokeWidth={1.5} />, desc: "Van Nuys, Burbank & Long Beach FBO connections." },
];

export default function Services() {
  useSEO({
    title: "Luxury Transportation Services in Los Angeles",
    description: "Eclipse Transport offers premium transportation services in Los Angeles: airport transfers to LAX, BUR, LGB & SNA, corporate travel, wedding car service, hourly chauffeur, concerts, proms & date nights. Book online.",
    keywords: "luxury transportation services Los Angeles, airport transfer LAX, corporate car service LA, wedding limo Los Angeles, prom limo LA, concert transportation Los Angeles, chauffeur by the hour LA",
    canonical: "https://eclipsetransportla.com/services",
  });

  // Try API but never block rendering — static data shows immediately.
  // retry:0 so failures are instant instead of 30s of retries.
  const { data: apiServices } = useListServices({ query: { retry: 0, queryKey: ["listServices"] } });
  const services = (Array.isArray(apiServices) && apiServices.length > 0) ? apiServices : STATIC_SERVICES;

  return (
    <Layout>
      {/* Hero */}
      <div className="pt-40 pb-24 bg-white border-b border-black/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-4">What We Offer</h2>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-[#1A1A1A] mb-6 leading-none">
            Our Services
          </h1>
          <p className="text-[#1A1A1A]/60 text-xl font-light max-w-xl leading-relaxed">
            Tailored transportation solutions for the most discerning clients in Los Angeles.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-24 bg-[#FCFBF8]">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service: typeof STATIC_SERVICES[0], index: number) => (
              <div
                key={service.id}
                className="bg-white border border-black/5 rounded-2xl p-8 hover:shadow-md transition-shadow group"
              >
                {/* Icon + Price row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-full border border-black/8 flex items-center justify-center text-[#1A1A1A]/60 group-hover:border-[#1A1A1A]/20 transition-colors">
                    {getServiceIcon(service.icon)}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/30 mb-0.5">Starting from</p>
                    <p className="text-2xl font-light text-[#1A1A1A]">${service.priceFrom}</p>
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-xl font-medium text-[#1A1A1A] mb-3">{service.name}</h3>

                {/* Description */}
                <p className="text-[#1A1A1A]/55 text-sm leading-relaxed font-light mb-6">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  {(service.features || []).map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#1A1A1A]/70">
                      <Check className="w-4 h-4 text-[#1A1A1A]/40 mt-0.5 shrink-0" strokeWidth={2} />
                      <span className="font-light">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={`/book?service=${encodeURIComponent(service.name)}`}
                  className="inline-flex h-11 items-center justify-center bg-[#1A1A1A] text-white px-6 text-[10px] font-bold uppercase tracking-[0.18em] rounded-full hover:bg-[#333] transition-colors w-full"
                >
                  Book This Service
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Coverage */}
      <div className="py-24 bg-white border-t border-black/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-4">Coverage</h2>
            <h3 className="text-4xl font-light tracking-tight text-[#1A1A1A]">Where We Operate</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {serviceAreas.map((area, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full border border-black/8 flex items-center justify-center text-[#1A1A1A]/50 mx-auto mb-4">
                  {area.icon}
                </div>
                <h4 className="text-base font-medium mb-2 text-[#1A1A1A]">{area.title}</h4>
                <p className="text-[#1A1A1A]/50 text-sm leading-relaxed font-light">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing FAQ Accordion */}
      <div className="py-24 bg-[#FCFBF8] border-t border-black/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-4">Pricing</h2>
            <h3 className="text-4xl font-light tracking-tight text-[#1A1A1A]">Common Questions</h3>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "Are the prices shown final?",
                a: "The 'starting from' prices shown are base rates for the most common configuration of each service. Final pricing depends on vehicle selection, distance, and any add-ons (meet & greet, child seat, flowers). You'll see the exact total before confirming your booking.",
              },
              {
                q: "Do you charge extra for waiting time or flight delays?",
                a: "For airport transfers, we include a complimentary waiting period (45 min for international flights, 30 min for domestic) and monitor your flight in real time. There are no surprise charges for normal delays.",
              },
              {
                q: "What is the minimum for hourly bookings?",
                a: "Our hourly 'By the Hour' service has a 3-hour minimum within Greater Los Angeles. Special event packages (Prom, Date Night) include a 3-hour block at a fixed rate.",
              },
              {
                q: "Are gratuity and fuel included?",
                a: "A standard gratuity of 20% is added at checkout. Fuel surcharges may apply for destinations beyond our primary service zone. All fees are shown transparently before you confirm.",
              },
              {
                q: "Can I get a custom quote for large groups or multi-day events?",
                a: "Absolutely. Contact our dispatch team for group rates, wedding fleet packages, and multi-day corporate engagements. We accommodate complex itineraries with absolute precision.",
              },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-white border border-black/5 rounded-xl px-6">
                <AccordionTrigger className="text-left font-medium text-[#1A1A1A] py-5 hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-[#1A1A1A]/60 font-light leading-relaxed pb-5">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Process */}
      <div className="py-32 bg-[#1A1A1A] text-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-24">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40 mb-4">The Process</h2>
            <h3 className="text-4xl md:text-5xl font-light tracking-tight">How Eclipse Works</h3>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative">
              {[
                { step: "01", title: "Book", desc: "Reserve online or via phone in minutes." },
                { step: "02", title: "Confirm", desc: "We assign your chauffeur & vehicle." },
                { step: "03", title: "Meet", desc: "Driver arrives early & tracks flights." },
                { step: "04", title: "Arrive", desc: "A seamless, quiet journey to your destination." }
              ].map((item, i) => (
                <div key={i} className="text-center relative z-10">
                  <div className="w-16 h-16 bg-[#1A1A1A] border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-light">{item.step}</div>
                  <h4 className="text-lg font-medium mb-2">{item.title}</h4>
                  <p className="text-white/50 text-sm font-light max-w-[200px] mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="py-24 bg-white text-center border-t border-black/5">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light mb-6 tracking-tight text-[#1A1A1A]">Need a custom arrangement?</h2>
          <p className="text-[#1A1A1A]/60 mb-12 max-w-lg mx-auto font-light text-lg">
            We accommodate special requests and complex itineraries with absolute precision.
          </p>
          <Link href="/contact" className="inline-flex h-14 items-center justify-center border border-[#1A1A1A] text-[#1A1A1A] px-12 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#1A1A1A] hover:text-white transition-all shadow-sm">
            Contact Dispatch
          </Link>
        </div>
      </section>
    </Layout>
  );
}

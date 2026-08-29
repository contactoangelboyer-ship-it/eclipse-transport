import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { Users, Wifi, Briefcase, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import suburbanImg from "@assets/generated_images/fleet-suburban.jpg";
import escaladeImg from "@assets/generated_images/fleet-escalade.jpg";
import lincolnImg from "@assets/generated_images/fleet-lincoln.jpg";
import mercedesImg from "@assets/generated_images/fleet-mercedes.jpg";

const vehicles = [
  {
    id: "suburban",
    category: "SUVs",
    name: "Suburban",
    year: "2025",
    model: "Chevrolet Suburban S",
    description: "The pinnacle of understated luxury. Exceptionally spacious, impeccably maintained, and equipped for the most demanding clientele.",
    capacity: 7,
    luggage: "6 bags",
    minimumFare: "$120 base",
    extraMileRate: "$2.95 per mile beyond 15 miles",
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: true,
    amenities: ["High-speed Wi-Fi", "Tinted Windows", "Climate Control", "Bottled Water"],
    image: suburbanImg,
    reverse: false
  },
  {
    id: "escalade",
    category: "SUVs",
    name: "Escalade",
    year: "2024",
    model: "Cadillac Escalade ESV",
    description: "Commanding presence with refined interiors. Offers an unparalleled ride experience with cutting-edge technology and premium leather seating.",
    capacity: 7,
    luggage: "6 bags",
    minimumFare: "$140 base",
    extraMileRate: "$3.40 per mile beyond 15 miles",
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: true,
    amenities: ["Panoramic Sunroof", "Premium Audio", "Heated Seats", "Privacy Glass"],
    image: escaladeImg,
    reverse: true
  },
  {
    id: "lincoln",
    category: "Sedans",
    name: "Lincoln Continental",
    year: "2024",
    model: "Lincoln Continental",
    description: "Classic executive elegance. A quiet, smooth journey perfect for airport transfers and corporate travel with ample legroom.",
    capacity: 3,
    luggage: "3 bags",
    minimumFare: "$100 base",
    extraMileRate: "$2.40 per mile beyond 15 miles",
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: false,
    amenities: ["Executive Rear Seating", "Noise Cancellation", "Rear Climate Control"],
    image: lincolnImg,
    reverse: false
  },
  {
    id: "mercedes",
    category: "Sedans",
    name: "Mercedes S-Class",
    year: "2024",
    model: "Mercedes-Benz S-Class",
    description: "The ultimate standard in luxury sedans. State-of-the-art safety, exquisite craftsmanship, and an extraordinarily smooth ride.",
    capacity: 3,
    luggage: "3 bags",
    minimumFare: "$100 base",
    extraMileRate: "$2.40 per mile beyond 15 miles",
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: false,
    amenities: ["Ambient Lighting", "Massaging Seats", "Burmester Audio", "Rear Screens"],
    image: mercedesImg,
    reverse: true
  }
];

export default function Fleet() {
  const suvs = vehicles.filter(v => v.category === "SUVs");
  const sedans = vehicles.filter(v => v.category === "Sedans");

  return (
    <Layout>
      <div className="pt-40 pb-24 bg-[#FCFBF8]">
        <div className="container mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 text-[#1A1A1A] tracking-tight"
          >
            Our Fleet
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[#1A1A1A]/70 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed"
          >
            Uncompromising quality. Every journey is made in our meticulously maintained signature vehicles.
          </motion.p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] text-white py-16" data-testid="banner-fleet-standards">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-white/10 text-center">
            <div className="px-4">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-4 text-white/40" strokeWidth={1.5} />
              <h4 className="text-[11px] uppercase tracking-[0.15em] font-bold text-white/90">Quarterly Inspected</h4>
            </div>
            <div className="px-4">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-4 text-white/40" strokeWidth={1.5} />
              <h4 className="text-[11px] uppercase tracking-[0.15em] font-bold text-white/90">Fully Insured & Licensed</h4>
            </div>
            <div className="px-4">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-4 text-white/40" strokeWidth={1.5} />
              <h4 className="text-[11px] uppercase tracking-[0.15em] font-bold text-white/90">Professional Chauffeurs</h4>
            </div>
            <div className="px-4">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-4 text-white/40" strokeWidth={1.5} />
              <h4 className="text-[11px] uppercase tracking-[0.15em] font-bold text-white/90">Real-Time GPS Tracked</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white pb-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-32 mt-24">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-16 border-b border-black/5 pb-4">SUV Class</h2>
            <div className="flex flex-col gap-24">
              {suvs.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
              ))}
            </div>
          </div>

          <div className="mb-32">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-16 border-b border-black/5 pb-4">Sedan Class</h2>
            <div className="flex flex-col gap-24">
              {sedans.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
              ))}
            </div>
          </div>

          <div className="mt-32" data-testid="section-comparison">
            <div className="text-center mb-16">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-4">Fleet Specifications</h2>
              <h3 className="text-4xl md:text-5xl font-light tracking-tight text-[#1A1A1A]">Compare Vehicles</h3>
            </div>
            
            <div className="overflow-x-auto rounded-3xl border border-black/5 shadow-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#FCFBF8] border-b border-black/5">
                    <th className="p-6 font-bold text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">Specification</th>
                    <th className="p-6 font-bold text-[11px] uppercase tracking-[0.1em] text-[#1A1A1A]">Suburban</th>
                    <th className="p-6 font-bold text-[11px] uppercase tracking-[0.1em] text-[#1A1A1A]">Escalade</th>
                    <th className="p-6 font-bold text-[11px] uppercase tracking-[0.1em] text-[#1A1A1A]">Lincoln</th>
                    <th className="p-6 font-bold text-[11px] uppercase tracking-[0.1em] text-[#1A1A1A]">Mercedes</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-[#1A1A1A]/80">
                  <tr className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/60">Capacity</td>
                    <td className="p-6">Up to 7</td>
                    <td className="p-6">Up to 7</td>
                    <td className="p-6">Up to 3</td>
                    <td className="p-6">Up to 3</td>
                  </tr>
                  <tr className="bg-[#FCFBF8]/50 border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/60">Luggage</td>
                    <td className="p-6">6 bags</td>
                    <td className="p-6">6 bags</td>
                    <td className="p-6">3 bags</td>
                    <td className="p-6">3 bags</td>
                  </tr>
                  <tr className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/60">Starting Fare</td>
                    <td className="p-6">$120 (base)</td>
                    <td className="p-6">$140 (base)</td>
                    <td className="p-6">$100 (base)</td>
                    <td className="p-6">$100 (base)</td>
                  </tr>
                  <tr className="bg-[#FCFBF8]/50 border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/60">Extra Mile</td>
                    <td className="p-6">$2.95/mile</td>
                    <td className="p-6">$3.40/mile</td>
                    <td className="p-6">$2.40/mile</td>
                    <td className="p-6">$2.40/mile</td>
                  </tr>
                  <tr className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/60">Wi-Fi</td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                  </tr>
                  <tr className="bg-[#FCFBF8]/50 border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/60">Privacy Glass</td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                  </tr>
                  <tr className="hover:bg-black/[0.02] transition-colors">
                    <td className="p-6 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/60">Child Seat Available</td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-green-600"><CheckCircle2 className="w-5 h-5" /></td>
                    <td className="p-6 text-gray-300">-</td>
                    <td className="p-6 text-gray-300">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function VehicleCard({ vehicle, index }: { vehicle: any, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col ${vehicle.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}
      data-testid={`vehicle-card-${vehicle.id}`}
    >
      <div className="w-full lg:w-[55%] h-[50vh] lg:h-[65vh] overflow-hidden rounded-2xl bg-[#FCFBF8] shadow-sm relative group">
        <img 
          src={vehicle.image} 
          alt={vehicle.name} 
          className="w-full h-full object-cover object-center transition-transform duration-[2s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>
      <div className="w-full lg:w-[45%] flex flex-col justify-center">
        <h3 className="text-4xl lg:text-5xl font-light mb-2 text-[#1A1A1A] tracking-tight">{vehicle.name}</h3>
        <p className="text-[#1A1A1A]/50 mb-8 uppercase tracking-[0.2em] text-[10px] font-bold">
          {vehicle.year} {vehicle.model}
        </p>
        
        <p className="text-[#1A1A1A]/70 leading-relaxed mb-12 font-light text-lg">
          {vehicle.description}
        </p>

        <div className="grid grid-cols-3 gap-y-8 gap-x-6 mb-12 border-y border-black/5 py-8">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-[#1A1A1A]/30" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-[#1A1A1A] text-[10px] uppercase tracking-[0.15em]">Capacity</p>
              <p className="text-sm text-[#1A1A1A]/60 mt-1">{vehicle.capacity} Passengers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Briefcase className="w-5 h-5 text-[#1A1A1A]/30" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-[#1A1A1A] text-[10px] uppercase tracking-[0.15em]">Luggage</p>
              <p className="text-sm text-[#1A1A1A]/60 mt-1">{vehicle.luggage}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Wifi className="w-5 h-5 text-[#1A1A1A]/30" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-[#1A1A1A] text-[10px] uppercase tracking-[0.15em]">Starting Fare</p>
              <p className="text-sm font-semibold text-[#1A1A1A]/80 mt-1">{vehicle.minimumFare}</p>
              <p className="text-[10px] text-[#1A1A1A]/40 mt-0.5">{vehicle.extraMileRate}</p>
            </div>
          </div>
        </div>
        
        {vehicle.amenities && (
          <div className="mb-12">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4 text-[#1A1A1A]/40">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {vehicle.amenities.map((amenity: string, i: number) => (
                <span key={i} className="text-xs bg-[#FCFBF8] border border-black/5 px-4 py-2 text-[#1A1A1A]/70 rounded-full font-medium shadow-sm">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <Link 
          href={`/book?vehicle=${vehicle.id}`} 
          className="w-fit h-14 px-10 inline-flex items-center justify-center bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-black transition-all hover:scale-105 shadow-md active:scale-95"
        >
          Book this vehicle
        </Link>
      </div>
    </motion.div>
  );
}
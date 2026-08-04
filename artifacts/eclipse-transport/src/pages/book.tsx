import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useListFleet, useCreateBooking } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import venmoQrCode from "@assets/1785882818432_1785882851990.jpg";
import { 
  Plane, Briefcase, Heart, GlassWater, Music, 
  Trophy, MapPin, Gem, Clock, CheckCircle2, 
  ArrowRight, ArrowLeft, Users, BaggageClaim,
  Plus, Minus
} from "lucide-react";

// Types
const TRIP_TYPES = [
  { id: "Airport Transfer", icon: Plane, label: "Airport Transfer", desc: "LAX, BUR, VNY, LGB" },
  { id: "Corporate Travel", icon: Briefcase, label: "Corporate Travel", desc: "Executive transport" },
  { id: "Date Night", icon: GlassWater, label: "Date Night", desc: "Elegant evening out" },
  { id: "Prom", icon: Heart, label: "Prom", desc: "Safe, memorable night" },
  { id: "Concerts", icon: Music, label: "Concerts", desc: "Skip the parking hassle" },
  { id: "Sports Events", icon: Trophy, label: "Sports Events", desc: "Arrive in style" },
  { id: "Around Town", icon: MapPin, label: "Around Town", desc: "City exploration" },
  { id: "Wedding", icon: Gem, label: "Wedding", desc: "Your special day" },
  { id: "By the Hour", icon: Clock, label: "By the Hour", desc: "Flexible itinerary" },
  { id: "Air Transportation", icon: Plane, label: "Air Transportation", desc: "Private aviation connections" },
];

const ADDONS = [
  { id: "addonMeetGreet", label: "Meet & Greet (Inside Terminal)", price: 25 },
  { id: "addonChildSeat", label: "Child Seat", price: 20 },
  { id: "addonFlowers", label: "Welcome Flowers", price: 45 },
  { id: "addonFlightMonitor", label: "Flight Monitoring", price: 0 },
];

export default function Book() {
  const [step, setStep] = useState(1);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  
  const { data: fleet, isLoading: isFleetLoading } = useListFleet();
  const createBooking = useCreateBooking();

  // Form State
  const [formData, setFormData] = useState<any>({
    tripType: "",
    vehicleId: "",
    pickupLocation: "",
    dropoffLocation: "",
    pickupDate: "",
    pickupTime: "",
    passengers: 1,
    luggage: 0,
    duration: 3, // default for By the Hour
    extraStops: 0,
    flightNumber: "", // local state, combined into special instructions if needed or just kept
    passengerName: "",
    passengerEmail: "",
    passengerPhone: "",
    addonMeetGreet: false,
    addonChildSeat: false,
    addonFlowers: false,
    addonFlightMonitor: false,
    specialInstructions: "",
  });

  // Derived calculations
  const selectedVehicle = fleet?.find(v => v.id.toString() === formData.vehicleId);
  const isHourly = formData.tripType === "By the Hour";
  const isAirport = formData.tripType === "Airport Transfer" || formData.tripType === "Air Transportation";

  const estimatedTotal = useMemo(() => {
    if (!selectedVehicle) return 0;
    
    let total = 0;
    if (isHourly) {
      total += selectedVehicle.hourlyRate * (formData.duration || 3);
    } else {
      total += selectedVehicle.flatRate;
    }

    if (formData.extraStops) total += formData.extraStops * 15;
    if (formData.addonMeetGreet) total += 25;
    if (formData.addonChildSeat) total += 20;
    if (formData.addonFlowers) total += 45;

    return total;
  }, [selectedVehicle, isHourly, formData]);

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const validateStep = (s: number) => {
    switch(s) {
      case 1: return formData.tripType !== "";
      case 2: return formData.pickupLocation !== "" && formData.pickupDate !== "" && formData.pickupTime !== "";
      case 3: return formData.vehicleId !== "";
      case 4: return formData.passengerName !== "" && formData.passengerEmail !== "" && formData.passengerPhone !== "";
      default: return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, 4));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    let instructions = formData.specialInstructions || "";
    if (isAirport && formData.flightNumber) {
      instructions = `Flight: ${formData.flightNumber}\n${instructions}`;
    }

    createBooking.mutate({
      data: {
        tripType: formData.tripType,
        vehicleId: formData.vehicleId,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        passengers: formData.passengers,
        luggage: formData.luggage,
        duration: isHourly ? formData.duration : null,
        extraStops: formData.extraStops,
        passengerName: formData.passengerName,
        passengerEmail: formData.passengerEmail,
        passengerPhone: formData.passengerPhone,
        addonMeetGreet: formData.addonMeetGreet,
        addonChildSeat: formData.addonChildSeat,
        addonFlowers: formData.addonFlowers,
        addonFlightMonitor: formData.addonFlightMonitor,
        specialInstructions: instructions,
        estimatedTotal: estimatedTotal
      }
    }, {
      onSuccess: (data) => {
        setConfirmationCode(data.confirmationCode);
        setBookingConfirmed(true);
        window.scrollTo(0, 0);
      }
    });
  };

  // UI Components for steps
  const Step1 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {TRIP_TYPES.map((type) => (
        <div 
          key={type.id}
          onClick={() => { updateForm("tripType", type.id); setTimeout(nextStep, 300); }}
          className={`cursor-pointer border p-6 flex flex-col items-center text-center transition-all ${
            formData.tripType === type.id 
              ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(196,154,60,0.15)]" 
              : "border-border bg-card hover:border-primary/50"
          }`}
          data-testid={`triptype-${type.id.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <type.icon size={32} className={`mb-4 ${formData.tripType === type.id ? "text-primary" : "text-muted-foreground"}`} />
          <h3 className="font-bold mb-2">{type.label}</h3>
          <p className="text-xs text-muted-foreground">{type.desc}</p>
        </div>
      ))}
    </div>
  );

  const Counter = ({ label, value, min, max, onChange }: any) => (
    <div className="flex items-center justify-between bg-background border border-border p-3">
      <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="p-1 hover:text-primary disabled:opacity-50"><Minus size={16} /></button>
        <span className="font-bold w-6 text-center">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="p-1 hover:text-primary disabled:opacity-50"><Plus size={16} /></button>
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup Location *</label>
          <input 
            type="text" 
            value={formData.pickupLocation} 
            onChange={e => updateForm("pickupLocation", e.target.value)} 
            placeholder="Address, Hotel, or Airport"
            className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none"
            required
          />
        </div>
        {!isHourly && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dropoff Location</label>
            <input 
              type="text" 
              value={formData.dropoffLocation} 
              onChange={e => updateForm("dropoffLocation", e.target.value)} 
              placeholder="Address, Hotel, or Airport"
              className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup Date *</label>
          <input 
            type="date" 
            value={formData.pickupDate} 
            onChange={e => updateForm("pickupDate", e.target.value)} 
            className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none min-h-[50px] custom-date-input"
            required
            style={{ colorScheme: "dark" }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup Time *</label>
          <input 
            type="time" 
            value={formData.pickupTime} 
            onChange={e => updateForm("pickupTime", e.target.value)} 
            className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none min-h-[50px]"
            required
            style={{ colorScheme: "dark" }}
          />
        </div>
      </div>

      {isAirport && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flight Number (Optional)</label>
          <input 
            type="text" 
            value={formData.flightNumber} 
            onChange={e => updateForm("flightNumber", e.target.value)} 
            placeholder="e.g. AA 1234"
            className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Counter label="Passengers" value={formData.passengers} min={1} max={14} onChange={(v: number) => updateForm("passengers", v)} />
        <Counter label="Luggage" value={formData.luggage} min={0} max={10} onChange={(v: number) => updateForm("luggage", v)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isHourly && (
          <Counter label="Duration (Hours)" value={formData.duration} min={3} max={12} onChange={(v: number) => updateForm("duration", v)} />
        )}
        <Counter label="Extra Stops" value={formData.extraStops} min={0} max={5} onChange={(v: number) => updateForm("extraStops", v)} />
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-6">
      {isFleetLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-card animate-pulse border border-border"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fleet?.map((v) => {
            const isSelected = formData.vehicleId === v.id.toString();
            const price = isHourly ? v.hourlyRate * (formData.duration || 3) : v.flatRate;
            
            return (
              <div 
                key={v.id}
                onClick={() => updateForm("vehicleId", v.id.toString())}
                className={`cursor-pointer bg-card border transition-all overflow-hidden ${
                  isSelected ? "border-primary shadow-[0_0_20px_rgba(196,154,60,0.15)] ring-1 ring-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="aspect-video bg-background relative flex items-center justify-center border-b border-border">
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent z-10"></div>
                  <span className="text-muted-foreground/20 font-serif italic text-4xl tracking-widest relative z-0">{v.model.split(' ')[0]}</span>
                </div>
                <div className="p-6 relative z-20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{v.name}</h3>
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1">{v.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{v.model}</p>
                  
                  <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users size={14} /> {v.maxPassengers}</span>
                    <span className="flex items-center gap-1"><BaggageClaim size={14} /> {v.maxLuggage}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Est. Total</span>
                    <span className="text-2xl font-bold text-primary">${price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const Step4 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-10">
        <div>
          <h3 className="text-xl font-bold mb-6">Passenger Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</label>
              <input 
                type="text" 
                value={formData.passengerName} 
                onChange={e => updateForm("passengerName", e.target.value)} 
                className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email *</label>
              <input 
                type="email" 
                value={formData.passengerEmail} 
                onChange={e => updateForm("passengerEmail", e.target.value)} 
                className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number *</label>
              <input 
                type="tel" 
                value={formData.passengerPhone} 
                onChange={e => updateForm("passengerPhone", e.target.value)} 
                className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-6">Add-ons</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ADDONS.map(addon => (
              <div 
                key={addon.id}
                onClick={() => updateForm(addon.id, !formData[addon.id])}
                className={`cursor-pointer border p-4 flex justify-between items-center transition-colors ${
                  formData[addon.id] ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <span className="text-sm font-medium">{addon.label}</span>
                <span className="text-sm font-bold text-primary">{addon.price === 0 ? "Included" : `+$${addon.price}`}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-6">Special Instructions</h3>
          <textarea 
            value={formData.specialInstructions}
            onChange={e => updateForm("specialInstructions", e.target.value)}
            placeholder="Any specific requests or directions for your chauffeur?"
            className="w-full bg-background border border-border px-4 py-3 focus:border-primary outline-none min-h-[100px] resize-none"
          ></textarea>
        </div>

        {/* PAYMENT SECTION */}
        <div className="bg-card border border-primary p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
          <h3 className="text-2xl font-bold mb-2 relative z-10">Secure Payment</h3>
          <p className="text-muted-foreground mb-8 relative z-10">Payment is due at time of service or upon confirmation. We accept:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {/* Zelle */}
            <div className="border border-border bg-background p-6 rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#741ee8]/10 rounded-sm flex items-center justify-center text-[#741ee8] font-bold text-xl font-serif">Z</div>
                <h4 className="text-xl font-bold">Zelle</h4>
              </div>
              <div className="space-y-1 mb-4">
                <p className="text-sm text-muted-foreground">Phone Number:</p>
                <p className="text-lg font-mono tracking-wider font-semibold">626-391-3844</p>
                <p className="text-sm text-muted-foreground mt-2">Name:</p>
                <p className="font-semibold text-foreground">Jose Maldonado</p>
              </div>
            </div>
            
            {/* Venmo */}
            <div className="border border-border bg-background p-6 rounded-sm flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#008CFF]/10 rounded-sm flex items-center justify-center text-[#008CFF] font-bold text-xl italic font-serif">v</div>
                <h4 className="text-xl font-bold">Venmo</h4>
              </div>
              <p className="text-primary font-mono tracking-widest font-semibold mb-4">@Jose-Maldonado-674</p>
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-border/50">
                <img src={venmoQrCode} alt="Venmo QR Code" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
          
          <p className="text-sm font-medium text-center mt-6 text-muted-foreground border-t border-border pt-6">
            <span className="text-primary">Important:</span> Please include your confirmation code as the memo when sending payment.
          </p>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-card border border-border p-6 sticky top-24">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 pb-4 border-b border-border">Booking Summary</h3>
          
          <div className="space-y-4 mb-6 pb-6 border-b border-border">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Service</span>
              <span className="font-semibold">{formData.tripType}</span>
            </div>
            {selectedVehicle && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Vehicle</span>
                <span className="font-semibold">{selectedVehicle.name}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Date & Time</span>
              <span className="font-semibold">{formData.pickupDate} at {formData.pickupTime}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-lg mb-8">
            <span className="font-bold">Estimated Total</span>
            <span className="font-bold text-primary">${estimatedTotal}</span>
          </div>

          <button 
            type="button"
            onClick={handleSubmit}
            disabled={!validateStep(4) || createBooking.isPending}
            className="w-full bg-primary text-primary-foreground py-4 text-center font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createBooking.isPending ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );

  // Confirmation Screen
  if (bookingConfirmed) {
    return (
      <Layout>
        <div className="bg-background min-h-screen py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-8 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border p-8 md:p-12 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Booking Confirmed!</h1>
              <p className="text-muted-foreground mb-8">Your reservation has been successfully received.</p>
              
              <div className="bg-background border border-border py-4 px-6 inline-block mx-auto mb-10">
                <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">Confirmation Code</span>
                <span className="text-2xl font-mono font-bold tracking-widest text-primary">{confirmationCode || "ECL-XXXXXX"}</span>
              </div>

              <div className="text-left bg-background border border-border p-6 mb-10 space-y-4">
                <h3 className="font-bold border-b border-border pb-4 mb-4">Trip Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground block">Service:</span> {formData.tripType}</div>
                  <div><span className="text-muted-foreground block">Date:</span> {formData.pickupDate}</div>
                  <div><span className="text-muted-foreground block">Time:</span> {formData.pickupTime}</div>
                  <div><span className="text-muted-foreground block">Vehicle:</span> {selectedVehicle?.name}</div>
                  <div className="col-span-2"><span className="text-muted-foreground block">Pickup:</span> {formData.pickupLocation}</div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary p-6 md:p-8 text-left mb-10">
                <h3 className="font-bold text-xl mb-2 text-primary">Please complete your payment</h3>
                <p className="text-sm text-muted-foreground mb-6 pb-6 border-b border-primary/20">
                  To secure your reservation, please send payment via Zelle or Venmo using your confirmation code <span className="font-mono text-primary font-bold">{confirmationCode}</span> as the memo.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-[#741ee8]/20 flex items-center justify-center text-[#741ee8] text-xs font-bold rounded-sm">Z</span> 
                      Zelle
                    </h4>
                    <p className="text-sm"><span className="text-muted-foreground">Phone:</span> <span className="font-mono font-semibold">626-391-3844</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Name:</span> Jose Maldonado</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-[#008CFF]/20 flex items-center justify-center text-[#008CFF] text-xs font-bold rounded-sm italic font-serif">v</span> 
                      Venmo
                    </h4>
                    <p className="text-sm mb-3"><span className="text-muted-foreground">Handle:</span> <span className="font-mono font-semibold text-primary">@Jose-Maldonado-674</span></p>
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-border">
                      <img src={venmoQrCode} alt="Venmo QR Code" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.location.reload()} 
                className="bg-background border border-border hover:bg-card px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                Book Another Ride
              </button>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  // Main Booking Form
  return (
    <Layout>
      {/* Sticky Step Bar */}
      <div className="sticky top-[73px] md:top-[88px] z-40 bg-background/95 backdrop-blur-sm border-b border-border py-4">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10 hidden md:block"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 hidden md:block transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`flex flex-col items-center ${step === s ? "opacity-100" : step > s ? "opacity-100" : "opacity-40 hidden md:flex"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                }`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                <span className="text-[10px] uppercase tracking-widest font-semibold hidden md:block">
                  {s === 1 ? "Trip Type" : s === 2 ? "Details" : s === 3 ? "Vehicle" : "Payment"}
                </span>
              </div>
            ))}
            
            {/* Mobile current step label */}
            <div className="md:hidden flex items-center justify-center w-full absolute inset-0 pointer-events-none text-sm font-semibold uppercase tracking-widest text-primary">
              Step {step} of 4: {step === 1 ? "Trip Type" : step === 2 ? "Details" : step === 3 ? "Vehicle" : "Payment"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background min-h-screen pt-8 pb-32">
        <div className="container mx-auto px-4 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-8 text-center md:text-left">
                {step === 1 ? "Select Service Type" : 
                 step === 2 ? "Trip Details" : 
                 step === 3 ? "Select Your Vehicle" : "Final Details & Payment"}
              </h2>
              
              {step === 1 && <Step1 />}
              {step === 2 && <Step2 />}
              {step === 3 && <Step3 />}
              {step === 4 && <Step4 />}

              {/* Desktop Navigation */}
              {step < 4 && (
                <div className="hidden md:flex justify-between mt-12 pt-8 border-t border-border">
                  <button 
                    onClick={prevStep} 
                    disabled={step === 1}
                    className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-0 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    onClick={nextStep} 
                    disabled={!validateStep(step)}
                    className="bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {step > 1 && step < 4 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex justify-between items-center z-50">
          <div className="flex flex-col">
            <button onClick={prevStep} className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ArrowLeft size={12} /> Back
            </button>
            {step === 3 && <span className="font-bold text-primary mt-1">${estimatedTotal}</span>}
          </div>
          <button 
            onClick={nextStep} 
            disabled={!validateStep(step)}
            className="bg-primary text-primary-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}
    </Layout>
  );
}

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GooglePlacesInput, type GooglePlaceSelection } from "@/components/GooglePlacesInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBooking, getListBookingsQueryKey, type BookingInput } from "@workspace/api-client-react";
import {
  BOOKING_ADDON_PRICES,
  BOOKING_VEHICLES,
  calculateBookingPrice,
} from "@workspace/booking-pricing";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Loader2, Check,
  Users, Plus, Minus, Luggage, ChevronLeft,
  ChevronRight, Plane, Briefcase, Heart, Music, Trophy,
  Car, Church, Wind, MapPin, Clock,
} from "lucide-react";
import { StripeCheckout } from "@/components/StripeCheckout";
import { useSEO } from "@/hooks/useSEO";

import suburbanImg from "@assets/generated_images/fleet-suburban.jpg";
import escaladeImg from "@assets/generated_images/fleet-escalade.jpg";
import lincolnImg from "@assets/generated_images/fleet-lincoln.jpg";

import eclipseLogoTransparent from "@assets/eclipse-logo-new-transparent.png";

/* ─────────────────────────── data ─────────────────────────── */

const vehicles = [
  { id: "suburban", name: "Suburban", model: "Chevrolet Suburban",     category: "SUV",   pax: 7, bags: 6, image: suburbanImg, amenities: ["Wi-Fi", "Privacy glass"] },
  { id: "escalade", name: "Escalade", model: "Cadillac Escalade ESV",  category: "SUV",   pax: 7, bags: 6, image: escaladeImg, amenities: ["Sunroof", "Premium audio"] },
  { id: "sedan",    name: "Sedan",    model: "Luxury Sedan",           category: "Sedan", pax: 3, bags: 3, image: lincolnImg,  amenities: ["Executive seating", "Massaging seats"] },
];

const serviceTypes = [
  { id: "Airport Transfer",   icon: Plane,     label: "Airport",        desc: "LAX · BUR · LGB · SNA · ONT" },
  { id: "Corporate Travel",   icon: Briefcase, label: "Corporate",      desc: "Executive & roadshow transfers" },
  { id: "Around Town",        icon: MapPin,    label: "Point-to-Point", desc: "Custom routes across LA" },
  { id: "By the Hour",        icon: Clock,     label: "By the Hour",    desc: "3–12 hrs anywhere in LA" },
  { id: "Date Night",         icon: Heart,     label: "Date Night",     desc: "Romantic evening experience" },
  { id: "Concerts",           icon: Music,     label: "Events",         desc: "Concerts, shows & sporting events" },
  { id: "Wedding",            icon: Church,    label: "Wedding",        desc: "Bridal fleet service" },
  { id: "Prom",               icon: Car,       label: "Prom",           desc: "Safe & stylish prom night" },
  { id: "Sports Events",      icon: Trophy,    label: "Sports",         desc: "SoFi, Staples, Dodger Stadium" },
  { id: "Air Transportation", icon: Wind,      label: "Private Air",    desc: "FBO & private aviation" },
];

const formatUsd = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const createPaymentIdempotencyKey = () => {
  const r = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `eclipse-booking-${r}`;
};

/* ─────────────────────────── schema ─────────────────────────── */

const bookingSchema = z.object({
  serviceType:         z.string().min(1),
  pickupDate:          z.string().trim().min(1, "Select a pickup date"),
  pickupTime:          z.string().trim().min(1, "Select a pickup time"),
  pickupLocation:      z.string().trim().min(1, "Enter pickup location"),
  dropoffLocation:     z.string().optional(),
  duration:            z.coerce.number().min(1).max(12).optional(),
  vehicleId:           z.string().optional(),
  passengers:          z.coerce.number().min(1).max(14),
  luggage:             z.coerce.number().min(0).max(10),
  flightNumber:        z.string().optional(),
  airline:             z.string().optional(),
  terminal:            z.string().optional(),
  addonMeetGreet:      z.boolean().optional(),
  addonChildSeat:      z.boolean().optional(),
  addonFlowers:        z.boolean().optional(),
  extraStops:          z.coerce.number().min(0).max(10).optional(),
  specialInstructions: z.string().optional(),
  passengerName:       z.string().trim().min(2, "Enter your full name"),
  passengerEmail:      z.string().trim().email("Enter a valid email"),
  passengerPhone:      z.string().trim().min(7, "Enter a valid phone number"),
}).superRefine((data, ctx) => {
  if (data.serviceType !== "By the Hour" && !data.dropoffLocation?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dropoffLocation"], message: "Enter drop-off location" });
  }
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const STEPS = ["Route", "Vehicle", "Extras", "Details", "Payment"];

/* ─────────────────────────── sub-components ─────────────────────────── */

function Counter({ value, onChange, min = 0, max = 14, label, note }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; note?: string;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-[15px] font-medium text-gray-900">{label}</p>
        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 touch-manipulation">
          <Minus className="w-4 h-4 text-gray-500" />
        </button>
        <span className="w-5 text-center text-base font-semibold text-gray-900">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 touch-manipulation">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepPanel({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  return (
    <motion.div key={stepKey} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── main ─────────────────────────── */

export default function Book() {
  useSEO({
    title: "Book Your Ride — Luxury Car Service Los Angeles",
    description: "Book your luxury ride with Eclipse Transport in Los Angeles. Airport transfers, corporate travel, weddings & events. Cadillac Escalade, Chevrolet Suburban & Lincoln Continental. Easy online booking, secure payment.",
    keywords: "book luxury car service Los Angeles, reserve private driver LA, airport transfer booking LAX, online limousine reservation Los Angeles",
    canonical: "https://eclipsetransportla.com/book",
  });

  const [step, setStep]                       = useState(1);
  const [isSuccess, setIsSuccess]             = useState(false);
  const [clientSecret, setClientSecret]       = useState<string | null>(null);
  const stripePublishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() || null;
  const [paymentAmount, setPaymentAmount]     = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [piLoading, setPiLoading]             = useState(false);
  const [piError, setPiError]                 = useState<string | null>(null);
  const [pickupPoint, setPickupPoint]         = useState<GooglePlaceSelection | null>(null);
  const [dropoffPoint, setDropoffPoint]       = useState<GooglePlaceSelection | null>(null);
  const [routeMiles, setRouteMiles]           = useState<number | null>(null);
  const [routeStatus, setRouteStatus]         = useState<"idle" | "calculating" | "ready" | "error">("idle");
  const [routeError, setRouteError]           = useState<string | null>(null);
  const [bookingError, setBookingError]       = useState<string | null>(null);
  const paymentSignatureRef                   = useRef<string | null>(null);
  const paymentIdempotencyKeyRef              = useRef<{ signature: string; key: string } | null>(null);
  const queryClient   = useQueryClient();
  const createBooking = useCreateBooking();

  const { register, handleSubmit, watch, setValue, trigger, control, formState: { errors } } =
    useForm<BookingFormValues>({
      resolver: zodResolver(bookingSchema),
      defaultValues: {
        serviceType:    "Airport Transfer",
        passengers:     1,
        luggage:        1,
        duration:       3,
        extraStops:     0,
        addonMeetGreet: false,
        addonChildSeat: false,
        addonFlowers:   false,
      },
      mode: "onChange",
    });

  const values     = watch();
  const isHourly   = values.serviceType === "By the Hour";
  const isAirport  = values.serviceType === "Airport Transfer";
  const vehicle    = vehicles.find(v => v.id === values.vehicleId);
  const selService = serviceTypes.find(s => s.id === values.serviceType);

  /* distance calculation */
  useEffect(() => {
    if (isHourly) { setRouteMiles(null); setRouteStatus("idle"); setRouteError(null); return; }
    if (!pickupPoint || !dropoffPoint) { setRouteMiles(null); setRouteStatus("idle"); setRouteError(null); return; }
    let cancelled = false;
    setRouteMiles(null); setRouteStatus("calculating"); setRouteError(null);
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins:      [{ lat: pickupPoint.lat,  lng: pickupPoint.lng }],
      destinations: [{ lat: dropoffPoint.lat, lng: dropoffPoint.lng }],
      travelMode:   window.google.maps.TravelMode.DRIVING,
      unitSystem:   window.google.maps.UnitSystem.IMPERIAL,
    }, (response: any, status: string) => {
      if (cancelled) return;
      const el = response?.rows?.[0]?.elements?.[0];
      if (status !== "OK" || el?.status !== "OK" || !el.distance?.value) {
        setRouteStatus("error");
        setRouteError("Couldn't calculate distance. Select addresses from the dropdown suggestions.");
        return;
      }
      setRouteMiles(el.distance.value / 1609.344);
      setRouteStatus("ready");
    });
    return () => { cancelled = true; };
  }, [dropoffPoint, isHourly, pickupPoint]);

  /* price — uses minimum fare when routeMiles not yet calculated */
  const priceBreakdown = calculateBookingPrice({
    vehicleId:      values.vehicleId || "",
    tripType:       values.serviceType,
    duration:       values.duration,
    routeMiles:     isHourly ? null : (routeMiles ?? (values.vehicleId ? 0 : null)),
    addonMeetGreet: values.addonMeetGreet,
    addonChildSeat: values.addonChildSeat,
    addonFlowers:   values.addonFlowers,
    extraStops:     values.extraStops,
  });
  // Fall back to minimum fare so step 5 always renders
  const vehicleData       = BOOKING_VEHICLES[values.vehicleId as keyof typeof BOOKING_VEHICLES];
  const minimumFare       = vehicleData?.minimumFare ?? 0;
  const rawTotal          = priceBreakdown.total;
  const totalEstimate     = rawTotal > 0 ? rawTotal : (isHourly ? 0 : minimumFare);
  const displayTotal      = paymentAmount ?? totalEstimate;

  const paymentSignature = [
    totalEstimate, values.passengerEmail, values.serviceType, values.vehicleId,
    values.duration, routeMiles, values.addonMeetGreet, values.addonChildSeat,
    values.addonFlowers, values.extraStops,
  ].join("|");

  /* navigation */
  const handleNext = async () => {
    let fields: (keyof BookingFormValues)[] = [];
    if (step === 1) {
      fields = ["pickupDate", "pickupTime", "pickupLocation"];
      if (!isHourly) fields.push("dropoffLocation");
      const ok = await trigger(fields);
      if (ok && !isHourly && routeStatus !== "ready") {
        setRouteError("Select both addresses from the dropdown suggestions to confirm the route.");
        return;
      }
      if (!ok) return;
    }
    if (step === 2 && !values.vehicleId) return;
    if (step === 3) { if (!(await trigger(["passengers", "luggage"]))) return; }
    if (step === 4) {
      if (!(await trigger(["passengerName", "passengerEmail", "passengerPhone"]))) return;
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* Stripe payment intent */
  useEffect(() => {
    if (step !== 5) return;
    if (totalEstimate <= 0) return;
    if (paymentSignatureRef.current === paymentSignature) return;
    paymentSignatureRef.current = paymentSignature;
    if (paymentIdempotencyKeyRef.current?.signature !== paymentSignature) {
      paymentIdempotencyKeyRef.current = { signature: paymentSignature, key: createPaymentIdempotencyKey() };
    }
    const idempotencyKey = paymentIdempotencyKeyRef.current.key;
    const controller     = new AbortController();
    setClientSecret(null); setPaymentIntentId(null); setPaymentAmount(null);
    setPiLoading(true); setPiError(null);

    if (!stripePublishableKey) {
      setPiError("Payment is not configured. Please contact dispatch."); setPiLoading(false); return;
    }

    const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
    fetch(`${apiBase}/api/stripe/payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey,
        quote: {
          vehicleId:      values.vehicleId || "",
          tripType:       values.serviceType,
          duration:       values.duration,
          routeMiles,
          addonMeetGreet: values.addonMeetGreet,
          addonChildSeat: values.addonChildSeat,
          addonFlowers:   values.addonFlowers,
          extraStops:     values.extraStops,
        },
        customerEmail: values.passengerEmail,
        metadata: {
          passengerName: values.passengerName || "Guest",
          serviceType:   values.serviceType,
          pickupDate:    values.pickupDate || "",
          routeMiles:    routeMiles?.toFixed(2) || "",
        },
      }),
      signal: controller.signal,
    })
      .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Payment setup failed."); return d; })
      .then(data => { setClientSecret(data.clientSecret); setPaymentAmount(typeof data.amount === "number" ? data.amount : totalEstimate); })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        paymentSignatureRef.current = null;
        setPiError(err instanceof Error ? err.message : "Unable to initialize payment. Please try again.");
      })
      .finally(() => { if (!controller.signal.aborted) setPiLoading(false); });

    return () => controller.abort();
  }, [step, paymentSignature, stripePublishableKey, totalEstimate]); // eslint-disable-line

  const saveBooking = (bookingData: BookingInput) => {
    setBookingError(null);
    createBooking.mutate({ data: bookingData }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }); setIsSuccess(true); window.scrollTo({ top: 0, behavior: "smooth" }); },
      onError: (error) => { setBookingError(error instanceof Error ? error.message : "Payment received but reservation save failed. Please call dispatch."); },
    });
  };

  const handlePaymentSuccess = (piId: string, data: BookingFormValues) => {
    setPaymentIntentId(piId);
    const reqs: string[] = [];
    if (data.addonMeetGreet)        reqs.push("Meet & Greet (+$25)");
    if (data.addonChildSeat)        reqs.push("Child Seat (+$20)");
    if (data.addonFlowers)          reqs.push("Welcome Flowers (+$45)");
    if ((data.extraStops || 0) > 0) reqs.push(`${data.extraStops} extra stop(s)`);
    if (data.specialInstructions)   reqs.push(`Notes: ${data.specialInstructions}`);
    if (data.flightNumber)          reqs.push(`Flight: ${data.airline || ""} ${data.flightNumber} / Terminal: ${data.terminal || "TBD"}`);
    if (routeMiles !== null)        reqs.push(`Distance: ${routeMiles.toFixed(1)} mi`);
    reqs.push(`Stripe Payment ID: ${piId}`);

    saveBooking({
      passengerName:   data.passengerName.trim(),
      passengerEmail:  data.passengerEmail.trim(),
      passengerPhone:  data.passengerPhone.trim(),
      pickupDate:      data.pickupDate,
      pickupTime:      data.pickupTime,
      pickupLocation:  data.pickupLocation,
      dropoffLocation: isHourly ? `As directed (${data.duration} hours)` : data.dropoffLocation!.trim(),
      passengers:      data.passengers,
      luggage:         data.luggage,
      vehicleType:     vehicle?.name || data.vehicleId || "",
      serviceType:     data.serviceType,
      specialRequests: reqs.join(" | "),
      estimatedPrice:  displayTotal,
    });
  };

  const onSubmit = () => {};

  /* ─── Success ─── */
  if (isSuccess) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Thank you, <strong>{values.passengerName}</strong>. A confirmation has been sent to <span className="font-medium">{values.passengerEmail}</span>.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="w-full max-w-sm mt-8 bg-gray-50 rounded-2xl p-5 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Booking Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Service</span><span className="font-medium">{values.serviceType}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Vehicle</span><span className="font-medium">{vehicle?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Date</span><span className="font-medium">{values.pickupDate} · {values.pickupTime}</span></div>
            <div className="border-t border-gray-200 pt-2 mt-1 flex justify-between font-bold">
              <span>Total Charged</span><span>{formatUsd(displayTotal)}</span>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="w-full max-w-sm mt-4">
          <a href="/" className="block w-full py-4 bg-black text-white rounded-2xl text-sm font-semibold text-center hover:bg-gray-900 transition-colors">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 h-14">
          {step > 1 ? (
            <button type="button" onClick={handleBack}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform touch-manipulation">
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          ) : (
            <a href="/"><img src={eclipseLogoTransparent} alt="Eclipse Transport" className="h-8 w-auto" /></a>
          )}
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">{STEPS[step - 1]}</p>
          <span className="text-xs text-gray-300 font-medium w-9 text-right">{step}/{STEPS.length}</span>
        </div>
        <div className="h-[2px] bg-gray-100">
          <motion.div className="h-full bg-black" style={{ transformOrigin: "left" }}
            animate={{ scaleX: progress / 100 }} initial={false}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }} />
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="flex-1 pt-[58px] pb-32">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">

            {/* ══ STEP 1 — Route ══ */}
            {step === 1 && (
              <StepPanel stepKey={1}>
                <div className="px-5 pt-8 pb-4">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900">Where to?</h1>
                </div>

                {/* Service type selector */}
                <div className="px-5 mb-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Service Type</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {serviceTypes.map(s => {
                      const Icon = s.icon;
                      const sel = values.serviceType === s.id;
                      return (
                        <button key={s.id} type="button" onClick={() => setValue("serviceType", s.id)}
                          className={`flex-none flex flex-col items-center gap-1.5 px-3 pt-3 pb-2.5 rounded-2xl transition-all duration-150 touch-manipulation min-w-[62px]
                            ${sel ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                          <Icon className={`w-5 h-5 ${sel ? "text-white" : "text-gray-400"}`} strokeWidth={1.6} />
                          <span className="text-[9px] font-bold uppercase tracking-wide leading-tight text-center whitespace-nowrap">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="px-5 space-y-4">
                  {/* Route inputs */}
                  <div className="bg-gray-50 rounded-2xl p-5 relative">
                    {!isHourly && <div className="absolute left-[26px] top-[44px] h-[52px] w-0.5 bg-gray-200" />}
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 bg-white shrink-0" />
                        <div className="flex-1">
                          <Controller name="pickupLocation" control={control} render={({ field }) => (
                            <GooglePlacesInput value={field.value || ""} onChange={field.onChange}
                              onPlaceSelect={setPickupPoint} placeholder="Pickup location"
                              className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium ${errors.pickupLocation ? "border-red-400 border" : ""}`} />
                          )} />
                          {errors.pickupLocation && <p className="text-xs text-red-500 mt-1">{errors.pickupLocation.message}</p>}
                        </div>
                      </div>
                      {!isHourly && (
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-sm bg-black shrink-0" />
                          <div className="flex-1">
                            <Controller name="dropoffLocation" control={control} render={({ field }) => (
                              <GooglePlacesInput value={field.value || ""} onChange={field.onChange}
                                onPlaceSelect={setDropoffPoint} placeholder="Drop-off location"
                                className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium ${errors.dropoffLocation ? "border-red-400 border" : ""}`} />
                            )} />
                            {errors.dropoffLocation && <p className="text-xs text-red-500 mt-1">{errors.dropoffLocation.message}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route status */}
                  {!isHourly && (
                    <div className="px-1 min-h-5 text-xs font-medium">
                      {routeStatus === "calculating" && <span className="flex items-center gap-1.5 text-gray-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating route...</span>}
                      {routeStatus === "ready" && routeMiles !== null && <span className="flex items-center gap-1.5 text-green-600"><Check className="w-3.5 h-3.5" /> Route confirmed · {routeMiles.toFixed(1)} miles</span>}
                      {routeStatus === "error" && <span className="text-red-500">{routeError}</span>}
                    </div>
                  )}

                  {/* Duration (hourly) */}
                  {isHourly && (
                    <div className="bg-gray-50 rounded-2xl px-5 py-2">
                      <Counter label="Duration" note="Minimum 3 hours"
                        value={values.duration || 3} onChange={v => setValue("duration", v)} min={3} max={12} />
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Schedule</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 font-medium mb-2">Pickup Date</label>
                        <Input type="date" {...register("pickupDate")} className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium ${errors.pickupDate ? "border-red-400 border" : ""}`} />
                        {errors.pickupDate && <p className="text-xs text-red-500 mt-1">{errors.pickupDate.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 font-medium mb-2">Pickup Time</label>
                        <Input type="time" {...register("pickupTime")} className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium ${errors.pickupTime ? "border-red-400 border" : ""}`} />
                        {errors.pickupTime && <p className="text-xs text-red-500 mt-1">{errors.pickupTime.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </StepPanel>
            )}

            {/* ══ STEP 2 — Vehicle ══ */}
            {step === 2 && (
              <StepPanel stepKey={2}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900">Choose a ride</h1>
                  <p className="text-gray-400 text-[13px] mt-1">All vehicles are insured & professionally chauffeured.</p>
                </div>
                <div className="px-5 space-y-3">
                  {vehicles.map(v => {
                    const selected = values.vehicleId === v.id;
                    const cardPrice = calculateBookingPrice({
                      vehicleId: v.id,
                      tripType: values.serviceType,
                      duration: values.duration,
                      routeMiles: isHourly ? null : (routeMiles ?? 0),
                      addonMeetGreet: values.addonMeetGreet,
                      addonChildSeat: values.addonChildSeat,
                      addonFlowers: values.addonFlowers,
                      extraStops: values.extraStops,
                    });
                    const cardMinimum = BOOKING_VEHICLES[v.id as keyof typeof BOOKING_VEHICLES]?.minimumFare ?? 0;
                    const cardTotal = cardPrice.total > 0 ? cardPrice.total : cardMinimum;
                    const hasConfirmedRoute = isHourly || routeMiles !== null;
                    return (
                      <button key={v.id} type="button" onClick={() => setValue("vehicleId", v.id)}
                        className={`w-full text-left rounded-3xl overflow-hidden transition-all duration-150 touch-manipulation
                          ${selected ? "ring-2 ring-black shadow-lg" : "ring-1 ring-gray-100 shadow-sm bg-white"}`}>
                        <div className="flex h-28">
                          <div className="w-[42%] h-full shrink-0">
                            <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-center bg-white relative">
                            {selected && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            )}
                            <p className="font-bold text-gray-900 text-sm pr-8">{v.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{v.category} · {v.model}</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                              <span className="text-base font-black text-gray-900">{formatUsd(cardTotal)}</span>
                              <span className="text-[10px] text-gray-400">{hasConfirmedRoute ? "estimated total" : "starting fare"}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                <Users className="w-3 h-3" /> {v.pax}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                <Luggage className="w-3 h-3" /> {v.bags}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </StepPanel>
            )}

            {/* ══ STEP 3 — Extras ══ */}
            {step === 3 && (
              <StepPanel stepKey={3}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900">Trip details</h1>
                  <p className="text-gray-400 text-[13px] mt-1">Customize your experience.</p>
                </div>
                <div className="px-5 space-y-4">
                  {/* Pax & Luggage */}
                  <div className="bg-gray-50 rounded-2xl px-5">
                    <Counter label="Passengers" value={values.passengers}
                      onChange={v => setValue("passengers", v)} min={1} max={vehicle?.pax || 14} />
                    <Counter label="Luggage pieces" value={values.luggage}
                      onChange={v => setValue("luggage", v)} min={0} max={vehicle?.bags || 10} />
                    <Counter label="Extra Stops" note="+$15 per stop"
                      value={values.extraStops || 0} onChange={v => setValue("extraStops", v)} min={0} max={5} />
                  </div>

                  {/* Add-ons */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Add-ons</p>
                    {[
                      { field: "addonMeetGreet" as const, label: "Meet & Greet", desc: "Chauffeur meets you at the gate (+$25)" },
                      { field: "addonChildSeat" as const, label: "Child Safety Seat", desc: "Pre-installed certified seat (+$20)" },
                      { field: "addonFlowers" as const,   label: "Welcome Flowers",   desc: "Seasonal bouquet on arrival (+$45)" },
                    ].map(({ field, label, desc }, i, arr) => (
                      <div key={field}>
                        <label className="flex items-center justify-between py-3 cursor-pointer">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{label}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${values[field] ? "bg-black border-black" : "border-gray-300"}`}
                            onClick={() => setValue(field, !values[field])}>
                            {values[field] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                          <input type="checkbox" {...register(field)} className="sr-only" />
                        </label>
                        {i < arr.length - 1 && <div className="h-px bg-gray-200" />}
                      </div>
                    ))}
                  </div>

                  {/* Flight info */}
                  {isAirport && (
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Flight Info <span className="font-normal normal-case text-gray-300 ml-1">· optional</span>
                      </p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="Airline" {...register("airline")} className="h-12 bg-white border-transparent shadow-sm rounded-xl text-sm" />
                          <Input placeholder="Flight #" {...register("flightNumber")} className="h-12 bg-white border-transparent shadow-sm rounded-xl text-sm" />
                        </div>
                        <Input placeholder="Terminal (e.g. Tom Bradley / Terminal 4)" {...register("terminal")} className="h-12 bg-white border-transparent shadow-sm rounded-xl text-sm" />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Notes</p>
                    <Textarea placeholder="Special instructions for your chauffeur..." {...register("specialInstructions")}
                      className="bg-white border-transparent shadow-sm rounded-xl text-sm resize-none h-20" />
                  </div>
                </div>
              </StepPanel>
            )}

            {/* ══ STEP 4 — Passenger Info ══ */}
            {step === 4 && (
              <StepPanel stepKey={4}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900">Who's riding?</h1>
                  <p className="text-gray-400 text-[13px] mt-1">Your contact info for confirmation & driver updates.</p>
                </div>
                <div className="px-5 space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                    <div>
                      <Input placeholder="Full Name" {...register("passengerName")}
                        className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm ${errors.passengerName ? "border-red-400 border" : ""}`} />
                      {errors.passengerName && <p className="text-xs text-red-500 mt-1">{errors.passengerName.message}</p>}
                    </div>
                    <div>
                      <Input type="email" placeholder="Email address" {...register("passengerEmail")}
                        className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm ${errors.passengerEmail ? "border-red-400 border" : ""}`} />
                      {errors.passengerEmail && <p className="text-xs text-red-500 mt-1">{errors.passengerEmail.message}</p>}
                    </div>
                    <div>
                      <Input type="tel" placeholder="Mobile number" {...register("passengerPhone")}
                        className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm ${errors.passengerPhone ? "border-red-400 border" : ""}`} />
                      {errors.passengerPhone && <p className="text-xs text-red-500 mt-1">{errors.passengerPhone.message}</p>}
                    </div>
                  </div>
                </div>
              </StepPanel>
            )}

            {/* ══ STEP 5 — Payment ══ */}
            {step === 5 && (
              <StepPanel stepKey={5}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900">Review & Pay</h1>
                  <p className="text-gray-400 text-[13px] mt-1">Secure payment via Stripe. Your info is encrypted.</p>
                </div>
                <div className="px-5 space-y-4">
                  {/* Summary card */}
                  <div className="bg-black text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Fare</p>
                    <p className="text-[46px] font-black tracking-tight leading-none mb-5">{formatUsd(displayTotal)}</p>
                    <div className="space-y-2 text-sm text-gray-300 border-t border-gray-800 pt-4">
                      <div className="flex justify-between">
                        <span>Service</span>
                        <span className="text-white font-medium">{selService?.label || values.serviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vehicle</span>
                        <span className="text-white font-medium">{vehicle?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time</span>
                        <span className="text-white font-medium">{values.pickupDate} · {values.pickupTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Passenger</span>
                        <span className="text-white font-medium">{values.passengerName}</span>
                      </div>
                      {routeMiles != null && !isHourly && (
                        <div className="flex justify-between">
                          <span>Distance</span>
                          <span className="text-white font-medium">{routeMiles.toFixed(1)} mi</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price breakdown */}
                  {priceBreakdown.baseRate > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-2 text-sm">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Price Breakdown</p>
                      <div className="flex justify-between text-gray-700">
                        <span>
                          {isHourly
                            ? `Base rate (${values.duration || 3} hrs × ${formatUsd(BOOKING_VEHICLES[values.vehicleId as keyof typeof BOOKING_VEHICLES]?.hourlyRate ?? 0)}/hr)`
                            : `Base fare (includes first 15 mi)`}
                        </span>
                        <span className="font-semibold">{formatUsd(BOOKING_VEHICLES[values.vehicleId as keyof typeof BOOKING_VEHICLES]?.minimumFare ?? priceBreakdown.baseRate)}</span>
                      </div>
                      {!isHourly && routeMiles != null && routeMiles > 15 && (
                        <div className="flex justify-between text-gray-700">
                          <span>{(routeMiles - 15).toFixed(1)} extra mi × {formatUsd(BOOKING_VEHICLES[values.vehicleId as keyof typeof BOOKING_VEHICLES]?.ratePerMile ?? 0)}</span>
                          <span className="font-semibold">{formatUsd(priceBreakdown.baseRate - (BOOKING_VEHICLES[values.vehicleId as keyof typeof BOOKING_VEHICLES]?.minimumFare ?? 0))}</span>
                        </div>
                      )}
                      {priceBreakdown.addonsTotal > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Add-ons</span>
                          <span className="font-semibold">{formatUsd(priceBreakdown.addonsTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-700">
                        <span>Gratuity (20%)</span>
                        <span className="font-semibold">{formatUsd(priceBreakdown.gratuity)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                        <span>Total</span>
                        <span>{formatUsd(displayTotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {bookingError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl font-medium">{bookingError}</div>
                  )}
                  {piError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl font-medium">{piError}</div>
                  )}

                  {/* Loading */}
                  {!clientSecret && !piError && (
                    <div className="py-12 flex flex-col items-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-3 text-black" />
                      <p className="text-sm font-medium">Preparing secure payment...</p>
                    </div>
                  )}

                  {/* Stripe form */}
                  {clientSecret && stripePublishableKey && (
                    <StripeCheckout
                      clientSecret={clientSecret}
                      publishableKey={stripePublishableKey}
                      amount={displayTotal}
                      onSuccess={(piId) => handlePaymentSuccess(piId, values)}
                      onError={(msg) => setPiError(msg)}
                    />
                  )}
                </div>
              </StepPanel>
            )}

          </AnimatePresence>
        </form>
      </div>

      {/* ── Bottom CTA ── */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-5 py-4 z-40"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={handleNext}
            className="w-full bg-black text-white h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.98] transition-all touch-manipulation">
            {step === 1 ? "Choose Vehicle" : step === 2 ? "Continue" : step === 3 ? "Enter Details" : "Review & Pay"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

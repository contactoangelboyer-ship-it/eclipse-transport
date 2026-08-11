import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout/Layout";
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
  CheckCircle2, Loader2, Plane, MapPin, Clock, Calendar,
  Users, Briefcase, Plus, Minus, ArrowRight, Phone,
  Heart, Music, Trophy, Car, Church, Wind,
  ChevronRight, ChevronLeft, Luggage, Wifi, Star, Check, Shield,
  CreditCard, Info, Lock
} from "lucide-react";
import { StripeCheckout } from "@/components/StripeCheckout";

import suburbanImg from "@assets/generated_images/fleet-suburban.jpg";
import escaladeImg from "@assets/generated_images/fleet-escalade.jpg";
import lincolnImg from "@assets/generated_images/fleet-lincoln.jpg";
import mercedesImg from "@assets/generated_images/fleet-mercedes.jpg";
import eclipseLogoTransparent from "@assets/eclipse-logo-new-transparent.png";

/* ─────────────────────────── data ─────────────────────────── */

const vehicles = [
  {
    id: "suburban", name: "Chevrolet Suburban", model: "2025 Suburban S",
    category: "SUV", pax: 7, bags: 6, ratePerMile: BOOKING_VEHICLES.suburban.ratePerMile, hourlyRate: BOOKING_VEHICLES.suburban.hourlyRate, minimumFare: BOOKING_VEHICLES.suburban.minimumFare,
    image: suburbanImg,
    amenities: ["High-speed Wi-Fi", "Privacy glass", "Climate control", "Bottled water"],
  },
  {
    id: "escalade", name: "Cadillac Escalade ESV", model: "2024 Escalade ESV",
    category: "SUV", pax: 7, bags: 6, ratePerMile: BOOKING_VEHICLES.escalade.ratePerMile, hourlyRate: BOOKING_VEHICLES.escalade.hourlyRate, minimumFare: BOOKING_VEHICLES.escalade.minimumFare,
    image: escaladeImg,
    amenities: ["Panoramic sunroof", "Premium audio", "Heated seats", "Privacy glass"],
  },
  {
    id: "lincoln", name: "Lincoln Continental", model: "2024 Continental",
    category: "Sedan", pax: 3, bags: 3, ratePerMile: BOOKING_VEHICLES.lincoln.ratePerMile, hourlyRate: BOOKING_VEHICLES.lincoln.hourlyRate, minimumFare: BOOKING_VEHICLES.lincoln.minimumFare,
    image: lincolnImg,
    amenities: ["Executive rear seating", "Noise cancellation", "Rear climate control"],
  },
  {
    id: "mercedes", name: "Mercedes-Benz S-Class", model: "2024 S-Class",
    category: "Sedan", pax: 3, bags: 3, ratePerMile: BOOKING_VEHICLES.mercedes.ratePerMile, hourlyRate: BOOKING_VEHICLES.mercedes.hourlyRate, minimumFare: BOOKING_VEHICLES.mercedes.minimumFare,
    image: mercedesImg,
    amenities: ["Ambient lighting", "Massaging seats", "Burmester audio", "Rear screens"],
  },
];

const tripTypes = [
  { id: "Airport Transfer",   icon: Plane,     title: "Airport Transfer",   desc: "LAX, BUR, LGB, SNA, ONT" },
  { id: "Corporate Travel",   icon: Briefcase, title: "Corporate Travel",   desc: "Executive black car" },
  { id: "Date Night",         icon: Heart,     title: "Date Night",         desc: "3-hour evening package" },
  { id: "Prom",               icon: Car,       title: "Prom",               desc: "Elegant & safe ride" },
  { id: "Concerts",           icon: Music,     title: "Concerts & Shows",   desc: "Drop-off & pickup" },
  { id: "Sports Events",      icon: Trophy,    title: "Sports Events",      desc: "All major LA venues" },
  { id: "Around Town",        icon: MapPin,    title: "Around Town",        desc: "Point-to-point in LA" },
  { id: "Wedding",            icon: Church,    title: "Wedding",            desc: "Bridal fleet service" },
  { id: "By the Hour",        icon: Clock,     title: "By the Hour",        desc: "3–12 hrs, as directed" },
  { id: "Air Transportation", icon: Wind,      title: "Air Transportation", desc: "Private aviation transfers" },
];

const addons = [
  { id: "addonMeetGreet",    label: "Meet & Greet",      desc: "Chauffeur meets you inside the terminal", price: BOOKING_ADDON_PRICES.meetGreet },
  { id: "addonFlightMonitor",label: "Flight Monitoring",  desc: "Real-time tracking, no extra wait fees",  price: 0, included: true },
  { id: "addonChildSeat",    label: "Child Seat",         desc: "Certified child safety seat",             price: BOOKING_ADDON_PRICES.childSeat },
  { id: "addonFlowers",      label: "Welcome Flowers",    desc: "Seasonal bouquet for arrivals & events",  price: BOOKING_ADDON_PRICES.flowers },
];

const formatUsd = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ─────────────────────────── schema ─────────────────────────── */

const bookingSchema = z.object({
  tripType:           z.string().min(1),
  pickupDate:         z.string().trim().min(1, "Select a pickup date"),
  pickupTime:         z.string().trim().min(1, "Select a pickup time"),
  pickupLocation:     z.string().trim().min(1, "Select a pickup location"),
  dropoffLocation:    z.string().optional(),
  flightNumber:       z.string().optional(),
  airline:            z.string().optional(),
  terminal:           z.string().optional(),
  duration:           z.coerce.number().min(1).max(12).optional(),
  returnTrip:         z.boolean().optional(),
  passengers:         z.coerce.number().min(1).max(14),
  luggage:            z.coerce.number().min(0).max(10),
  vehicleId:          z.string().optional(),
  passengerName:      z.string().trim().min(2, "Enter your full name"),
  passengerEmail:     z.string().trim().email("Enter a valid email address"),
  passengerPhone:     z.string().trim().min(7, "Enter a valid phone number"),
  addonMeetGreet:     z.boolean().optional(),
  addonChildSeat:     z.boolean().optional(),
  addonFlowers:       z.boolean().optional(),
  addonFlightMonitor: z.boolean().optional(),
  extraStops:         z.coerce.number().min(0).max(10).optional(),
  specialInstructions:z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tripType !== "By the Hour" && !data.dropoffLocation?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dropoffLocation"],
      message: "Select a drop-off location",
    });
  }
});

type BookingFormValues = z.infer<typeof bookingSchema>;

/* ─────────────────────────── stepper ─────────────────────────── */

const STEPS = ["Service", "Trip Details", "Vehicle", "Your Info", "Payment"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-0">
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Logo */}
          <a href="/" className="shrink-0 flex items-center py-2">
            <img
              src={eclipseLogoTransparent}
              alt="Eclipse Transport"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </a>
          {/* Divider */}
          <div className="w-px h-7 bg-gray-200 shrink-0 hidden sm:block" />
          {/* Steps */}
          <div className="flex items-center flex-1 min-w-0">
            {STEPS.map((label, i) => {
              const idx = i + 1;
              const done = current > idx;
              const active = current === idx;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center py-3.5 gap-1">
                    <motion.div
                      animate={{
                        backgroundColor: done || active ? "#1A1A1A" : "#F3F4F6",
                        scale: active ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                        ${done || active ? "text-white shadow-md" : "text-gray-400"}`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : idx}
                    </motion.div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap hidden sm:block transition-colors
                      ${active ? "text-[#1A1A1A]" : done ? "text-[#1A1A1A]/50" : "text-gray-300"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-1.5">
                      <motion.div
                        className="h-[2px] rounded-full"
                        animate={{ backgroundColor: done ? "#1A1A1A" : "#E5E7EB" }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── counter ─────────────────────────── */

function Counter({ value, onChange, min = 0, max = 14, label }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; label: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center hover:border-gray-400 active:scale-90 transition-all disabled:opacity-30 touch-manipulation"
          disabled={value <= min}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-7 text-center text-sm font-bold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center hover:border-gray-400 active:scale-90 transition-all disabled:opacity-30 touch-manipulation"
          disabled={value >= max}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── step animation ─────────────────────────── */

function StepPanel({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */

export default function Book() {
  const searchParams = new URLSearchParams(window.location.search);
  const defaultService = searchParams.get("service") || "Airport Transfer";
  const defaultVehicle  = searchParams.get("vehicle") || "";

  const [step, setStep]             = useState(1);
  const [isSuccess, setIsSuccess]   = useState(false);
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [piLoading, setPiLoading]   = useState(false);
  const [piError, setPiError]       = useState<string | null>(null);
  const [pickupPoint, setPickupPoint] = useState<GooglePlaceSelection | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<GooglePlaceSelection | null>(null);
  const [routeMiles, setRouteMiles] = useState<number | null>(null);
  const [routeStatus, setRouteStatus] = useState<"idle" | "calculating" | "ready" | "error">("idle");
  const [routeError, setRouteError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<BookingInput | null>(null);
  const paymentSignatureRef        = useRef<string | null>(null);
  const queryClient   = useQueryClient();
  const createBooking = useCreateBooking();

  const { register, handleSubmit, watch, setValue, trigger, control, formState: { errors } } =
    useForm<BookingFormValues>({
      resolver: zodResolver(bookingSchema),
      defaultValues: {
        tripType:           tripTypes.find(t => t.id === defaultService) ? defaultService : "Airport Transfer",
        passengers:         2,
        luggage:            2,
        duration:           3,
        extraStops:         0,
        vehicleId:          defaultVehicle,
        addonFlightMonitor: true,
      },
      mode: "onChange",
    });

  const values   = watch();
  const tripType = values.tripType;
  const isHourly  = tripType === "By the Hour";
  const isAirport = tripType === "Airport Transfer";
  const vehicle   = vehicles.find(v => v.id === values.vehicleId);

  useEffect(() => {
    if (isHourly) {
      setRouteMiles(null);
      setRouteStatus("idle");
      setRouteError(null);
      return;
    }

    if (!pickupPoint || !dropoffPoint) {
      setRouteMiles(null);
      setRouteStatus("idle");
      setRouteError(null);
      return;
    }

    let cancelled = false;
    setRouteMiles(null);
    setRouteStatus("calculating");
    setRouteError(null);

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [{ lat: pickupPoint.lat, lng: pickupPoint.lng }],
        destinations: [{ lat: dropoffPoint.lat, lng: dropoffPoint.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
      },
      (response: any, status: string) => {
        if (cancelled) return;
        const element = response?.rows?.[0]?.elements?.[0];
        if (status !== "OK" || element?.status !== "OK" || !element.distance?.value) {
          setRouteStatus("error");
          setRouteError("We couldn't calculate the driving distance. Please select both locations again.");
          return;
        }

        setRouteMiles(element.distance.value / 1609.344);
        setRouteStatus("ready");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [dropoffPoint, isHourly, pickupPoint]);

  /* ── price ── */
  const priceBreakdown = calculateBookingPrice({
    vehicleId: values.vehicleId || "",
    tripType,
    duration: values.duration,
    routeMiles,
    addonMeetGreet: values.addonMeetGreet,
    addonChildSeat: values.addonChildSeat,
    addonFlowers: values.addonFlowers,
    extraStops: values.extraStops,
  });
  const { baseRate, addonsTotal, gratuity, total: totalEstimate, minimumApplied } = priceBreakdown;
  const displayTotal = paymentAmount ?? totalEstimate;
  const paymentSignature = [
    totalEstimate,
    values.passengerEmail,
    values.tripType,
    values.vehicleId,
    values.duration,
    routeMiles,
    values.addonMeetGreet,
    values.addonChildSeat,
    values.addonFlowers,
    values.extraStops,
  ].join("|");

  /* ── navigation ── */
  const handleNext = async () => {
    let fields: (keyof BookingFormValues)[] = [];
    if (step === 2) {
      fields = ["pickupDate", "pickupTime", "pickupLocation"];
      if (!isHourly) fields.push("dropoffLocation");
      if (!isHourly && (routeMiles === null || routeStatus !== "ready")) {
        setRouteError("Select both locations from the address suggestions so we can calculate the real driving distance.");
        return;
      }
    }
    if (step === 3 && !values.vehicleId) return;
    if (step === 4) fields = ["passengerName", "passengerEmail", "passengerPhone"];
    const ok = await trigger(fields);
    if (ok) { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const handleBack = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Create Stripe payment intent when reaching step 5 ── */
  useEffect(() => {
    if (step !== 5 || totalEstimate <= 0) return;
    if (paymentSignatureRef.current === paymentSignature) return;
    paymentSignatureRef.current = paymentSignature;
    setClientSecret(null);
    setPaymentIntentId(null);
    setPiLoading(true);
    setPiError(null);

    fetch("/api/stripe/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: totalEstimate,
        quote: {
          vehicleId: values.vehicleId || "",
          tripType: values.tripType,
          duration: values.duration,
          routeMiles,
          addonMeetGreet: values.addonMeetGreet,
          addonChildSeat: values.addonChildSeat,
          addonFlowers: values.addonFlowers,
          extraStops: values.extraStops,
        },
        customerEmail: values.passengerEmail,
        metadata: {
          passengerName: values.passengerName || "Guest",
          serviceType:   values.tripType || "",
          pickupDate:    values.pickupDate || "",
          routeMiles:    routeMiles?.toFixed(2) || "",
        },
      }),
    })
      .then(async r => {
        const data = await r.json().catch(() => ({} as { clientSecret?: string; error?: string }));
        if (!r.ok) {
          throw new Error(data.error ?? `Payment setup failed (${r.status}).`);
        }
        return data;
      })
      .then((data: { clientSecret?: string; amount?: number; error?: string }) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setPaymentAmount(typeof data.amount === "number" ? data.amount : totalEstimate);
        } else {
          setPiError(data.error ?? "Could not initialise payment.");
        }
      })
      .catch((error: unknown) => {
        paymentSignatureRef.current = null;
        setPiError(error instanceof Error ? error.message : "Network error. Please check your connection.");
      })
      .finally(() => setPiLoading(false));
  }, [paymentSignature, step, totalEstimate]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveBooking = (bookingData: BookingInput) => {
    setBookingError(null);
    createBooking.mutate({ data: bookingData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onError: (error) => {
        setBookingError(
          error instanceof Error
            ? error.message
            : "Your payment was received, but we could not save the reservation. Please call dispatch with your payment reference.",
        );
      },
    });
  };

  /* ── Called after Stripe payment succeeds ── */
  const handlePaymentSuccess = (piId: string, data: BookingFormValues) => {
    setPaymentIntentId(piId);
    const reqs: string[] = [];
    if (data.addonMeetGreet)        reqs.push("Meet & Greet (+$25)");
    if (data.addonChildSeat)        reqs.push("Child Seat (+$20)");
    if (data.addonFlowers)          reqs.push("Welcome Flowers (+$45)");
    if (data.addonFlightMonitor)    reqs.push("Flight Monitoring (included)");
    if ((data.extraStops || 0) > 0) reqs.push(`${data.extraStops} extra stop(s) (+$${(data.extraStops || 0) * 15})`);
    if (data.specialInstructions)   reqs.push(`Notes: ${data.specialInstructions}`);
    if (data.flightNumber)          reqs.push(`Flight: ${data.airline || ""} ${data.flightNumber} / Terminal ${data.terminal || "TBD"}`);
    if (routeMiles !== null)        reqs.push(`Driving distance: ${routeMiles.toFixed(1)} miles`);
    reqs.push(`Stripe Payment ID: ${piId}`);

    const bookingData: BookingInput = {
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
      serviceType:     data.tripType,
      specialRequests: reqs.join(" | "),
      estimatedPrice:  displayTotal,
    };
    setPendingBooking(bookingData);
    saveBooking(bookingData);
  };

  /* ── Legacy onSubmit (kept for form handleSubmit compatibility) ── */
  const onSubmit = (_data: BookingFormValues) => { /* payment handled by Stripe form */ };

  /* ─────────────── success screen ─────────────── */
  if (isSuccess) {
    return (
      <Layout>
        <div className="min-h-[100dvh] bg-gray-50 px-4 py-16 flex items-start justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md w-full"
          >
            {/* Checkmark */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Received!</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Thank you, <strong>{values.passengerName}</strong>. We'll confirm your reservation within 15 minutes.
              </p>
            </div>

            {/* ── Payment confirmation badge ── */}
            {totalEstimate > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Payment Confirmed</p>
                    <p className="text-xs text-gray-500">{formatUsd(displayTotal)} charged successfully via Stripe</p>
                  </div>
                </div>
                {paymentIntentId && (
                  <p className="mt-3 text-[10px] text-gray-400 font-mono break-all">
                    Ref: {paymentIntentId}
                  </p>
                )}
              </div>
            )}

            {/* Booking summary */}
            {totalEstimate > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Booking Summary</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{values.tripType}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="font-medium">{vehicle?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{values.pickupDate} · {values.pickupTime}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Passengers</span><span className="font-medium">{values.passengers}</span></div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                    <span>Total</span><span>{formatUsd(displayTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mb-6">A confirmation will be sent to {values.passengerEmail}.</p>

            <a href="/" className="block w-full h-13 flex items-center justify-center bg-[#1A1A1A] text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors active:scale-95 py-4">
              Back to Home
            </a>
          </motion.div>
        </div>
      </Layout>
    );
  }

  /* ─────────────── main layout ─────────────── */
  return (
    <Layout hideLogo={true}>
      <StepBar current={step} />

      <div className="bg-gray-50 min-h-[calc(100dvh-57px)] pb-28 lg:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

            {/* ─── MAIN FORM ─── */}
            <div className="w-full lg:flex-1 min-w-0">
              <form onSubmit={handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">

                  {/* ═══ STEP 1 — Service Type ═══ */}
                  {step === 1 && (
                    <StepPanel stepKey={1}>
                      <div className="mb-6">
                        <h1 className="text-xl font-bold text-gray-900">What type of trip?</h1>
                        <p className="text-gray-400 text-sm mt-1">Choose the service that best fits your occasion.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {tripTypes.map(t => {
                          const Icon = t.icon;
                          const selected = tripType === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setValue("tripType", t.id)}
                              className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer touch-manipulation active:scale-[0.97]
                                ${selected
                                  ? "border-[#1A1A1A] bg-[#1A1A1A] shadow-lg"
                                  : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-md"}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                ${selected ? "bg-white/15" : "bg-gray-50 border border-gray-100"}`}>
                                <Icon className={`w-5 h-5 ${selected ? "text-white" : "text-gray-500"}`} strokeWidth={1.5} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight ${selected ? "text-white" : "text-gray-800"}`}>{t.title}</p>
                                <p className={`text-xs mt-1 leading-snug ${selected ? "text-white/55" : "text-gray-400"}`}>{t.desc}</p>
                              </div>
                              {selected && (
                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </StepPanel>
                  )}

                  {/* ═══ STEP 2 — Trip Details ═══ */}
                  {step === 2 && (
                    <StepPanel stepKey={2}>
                      <div className="mb-5">
                        <h1 className="text-xl font-bold text-gray-900">Trip details</h1>
                        <p className="text-gray-400 text-sm mt-1">Tell us when and where. All times are local LA time.</p>
                      </div>

                      <div className="space-y-3">
                        {/* Date & Time */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Date & Time</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-2">Pickup Date</label>
                              <Input
                                type="date"
                                {...register("pickupDate")}
                                className={`h-12 bg-gray-50 border-gray-200 rounded-xl text-sm font-medium ${errors.pickupDate ? "border-red-400" : ""}`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-2">Pickup Time</label>
                              <Input
                                type="time"
                                {...register("pickupTime")}
                                className={`h-12 bg-gray-50 border-gray-200 rounded-xl text-sm font-medium ${errors.pickupTime ? "border-red-400" : ""}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Duration for hourly */}
                        {isHourly && (
                          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Duration</p>
                            <Counter
                              label={<span className="flex items-center gap-2 text-sm font-medium text-gray-700"><Clock className="w-4 h-4 text-gray-400" />{`${values.duration || 3} hour${(values.duration || 3) > 1 ? "s" : ""} (min 3)`}</span>}
                              value={values.duration || 3}
                              onChange={v => setValue("duration", v)}
                              min={3}
                              max={12}
                            />
                          </div>
                        )}

                        {/* Locations */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Locations</p>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                              <MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                              Pickup Location
                            </label>
                            <Controller
                              name="pickupLocation"
                              control={control}
                              render={({ field }) => (
                                <GooglePlacesInput
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  onPlaceSelect={setPickupPoint}
                                  placeholder="Address, hotel, or airport terminal"
                                  className={`h-12 bg-gray-50 border-gray-200 rounded-xl ${errors.pickupLocation ? "border-red-400" : ""}`}
                                />
                              )}
                            />
                          </div>

                          {!isHourly && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-2">
                                <MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                Drop-off Location
                              </label>
                              <Controller
                                name="dropoffLocation"
                                control={control}
                                render={({ field }) => (
                                  <GooglePlacesInput
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    onPlaceSelect={setDropoffPoint}
                                    placeholder="Address, hotel, or venue"
                                    className={`h-12 bg-gray-50 border-gray-200 rounded-xl ${errors.dropoffLocation ? "border-red-400" : ""}`}
                                  />
                                )}
                              />
                            </div>
                          )}

                          {!isHourly && (
                            <div className={`rounded-xl px-3.5 py-3 text-xs ${
                              routeStatus === "error"
                                ? "bg-red-50 text-red-600"
                                : routeStatus === "ready"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-50 text-gray-500"
                            }`}>
                              {routeStatus === "calculating" && "Calculating driving distance…"}
                              {routeStatus === "ready" && routeMiles !== null && `${routeMiles.toFixed(1)} driving miles calculated for this route.`}
                              {routeStatus === "error" && routeError}
                              {routeStatus === "idle" && "Select both locations from the address suggestions to calculate your fare."}
                            </div>
                          )}
                          {routeError && routeStatus !== "error" && (
                            <p className="text-xs text-red-600">{routeError}</p>
                          )}

                          <Counter
                            label={<span className="flex items-center gap-2 text-sm font-medium text-gray-700"><MapPin className="w-4 h-4 text-gray-400" />Extra stops</span>}
                            value={values.extraStops || 0}
                            onChange={v => setValue("extraStops", v)}
                            min={0}
                            max={5}
                          />
                        </div>

                        {/* Flight info */}
                        {isAirport && (
                          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                              Flight Details <span className="text-gray-300 font-normal normal-case ml-1">(optional)</span>
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Airline</label>
                                <Input placeholder="e.g. Delta" {...register("airline")} className="h-12 bg-gray-50 border-gray-200 rounded-xl text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Flight #</label>
                                <Input placeholder="DL 234" {...register("flightNumber")} className="h-12 bg-gray-50 border-gray-200 rounded-xl text-sm" />
                              </div>
                              <div className="col-span-3">
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Terminal</label>
                                <Input placeholder="e.g. Tom Bradley / Terminal 4" {...register("terminal")} className="h-12 bg-gray-50 border-gray-200 rounded-xl text-sm" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Passengers & Luggage */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Passengers & Luggage</p>
                          <div className="space-y-3">
                            <Counter
                              label={<span className="flex items-center gap-2 text-sm font-medium text-gray-700"><Users className="w-4 h-4 text-gray-400" />Passengers</span>}
                              value={values.passengers}
                              onChange={v => setValue("passengers", v)}
                              min={1}
                              max={14}
                            />
                            <Counter
                              label={<span className="flex items-center gap-2 text-sm font-medium text-gray-700"><Luggage className="w-4 h-4 text-gray-400" />Bags</span>}
                              value={values.luggage}
                              onChange={v => setValue("luggage", v)}
                              min={0}
                              max={10}
                            />
                          </div>
                        </div>
                      </div>
                    </StepPanel>
                  )}

                  {/* ═══ STEP 3 — Vehicle ═══ */}
                  {step === 3 && (
                    <StepPanel stepKey={3}>
                      <div className="mb-5">
                        <h1 className="text-xl font-bold text-gray-900">Choose your vehicle</h1>
                        <p className="text-gray-400 text-sm mt-1">All vehicles are fully insured and professionally chauffeured.</p>
                      </div>

                      <div className="space-y-3">
                        {vehicles.map(v => {
                          const selected = values.vehicleId === v.id;
                          const price = isHourly
                            ? `$${v.hourlyRate}/hr · $${v.hourlyRate * (values.duration || 3)} total`
                            : `$${v.ratePerMile.toFixed(2)}/mile · min $${v.minimumFare}`;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setValue("vehicleId", v.id)}
                              className={`w-full text-left rounded-2xl border-2 bg-white overflow-hidden transition-all touch-manipulation active:scale-[0.99]
                                ${selected ? "border-[#1A1A1A] shadow-lg" : "border-gray-100 hover:border-gray-300 hover:shadow-md"}`}
                            >
                              <div className="flex flex-col sm:flex-row">
                                <div className="sm:w-40 h-36 sm:h-auto shrink-0 overflow-hidden bg-gray-50 relative">
                                  <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                                  {selected && (
                                    <div className="absolute inset-0 bg-[#1A1A1A]/10 flex items-center justify-center">
                                      <div className="w-9 h-9 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2
                                        ${selected ? "bg-[#1A1A1A] text-white" : "bg-gray-100 text-gray-500"}`}>
                                        {v.category}
                                      </span>
                                      <h3 className="font-bold text-gray-900 text-base leading-tight">{v.name}</h3>
                                      <p className="text-xs text-gray-400 mt-0.5">{v.model}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className={`text-xl font-bold ${selected ? "text-[#1A1A1A]" : "text-gray-800"}`}>
                                        ${isHourly ? v.hourlyRate : v.ratePerMile.toFixed(2)}
                                      </p>
                                      <p className="text-xs text-gray-400">{isHourly ? "per hour" : "per mile"}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Up to {v.pax} pax</span>
                                    <span className="flex items-center gap-1.5"><Luggage className="w-3.5 h-3.5" />{v.bags} bags</span>
                                    <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" />Wi-Fi</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 mt-3">
                                    {v.amenities.map(a => (
                                      <span key={a} className="text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5 text-gray-600">{a}</span>
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                    <span className="text-sm font-semibold text-gray-700">{price}</span>
                                    {selected && (
                                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]">
                                        <Check className="w-3.5 h-3.5" /> Selected
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {!values.vehicleId && (
                        <p className="text-center text-sm text-red-500 mt-4 font-medium">Please select a vehicle to continue.</p>
                      )}

                      {/* Add-ons */}
                      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Add-ons</p>
                        <div className="divide-y divide-gray-50">
                          {addons.map(addon => {
                            const key = addon.id as keyof BookingFormValues;
                            const checked = !!values[key];
                            return (
                              <div
                                key={addon.id}
                                className={`flex items-center justify-between py-4 cursor-pointer group touch-manipulation ${addon.included ? "opacity-70" : ""}`}
                                onClick={() => !addon.included && setValue(key, !checked as any)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                                    ${checked ? "bg-[#1A1A1A] border-[#1A1A1A]" : "border-gray-200 group-hover:border-gray-400"}`}>
                                    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{addon.label}</p>
                                    <p className="text-xs text-gray-400">{addon.desc}</p>
                                  </div>
                                </div>
                                <span className={`text-sm font-bold shrink-0 ml-4 ${addon.included ? "text-green-600" : "text-gray-700"}`}>
                                  {addon.included ? "Included" : `+$${addon.price}`}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between py-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">Extra Stops</p>
                              <p className="text-xs text-gray-400">$15 per additional stop</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button type="button" onClick={() => setValue("extraStops", Math.max(0, (values.extraStops || 0) - 1))}
                                className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 text-gray-600 touch-manipulation active:scale-90">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm font-bold">{values.extraStops || 0}</span>
                              <button type="button" onClick={() => setValue("extraStops", Math.min(5, (values.extraStops || 0) + 1))}
                                className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 text-gray-600 touch-manipulation active:scale-90">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </StepPanel>
                  )}

                  {/* ═══ STEP 4 — Your Info ═══ */}
                  {step === 4 && (
                    <StepPanel stepKey={4}>
                      <div className="mb-5">
                        <h1 className="text-xl font-bold text-gray-900">Your information</h1>
                        <p className="text-gray-400 text-sm mt-1">We'll send your confirmation here and share it with your chauffeur.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Information</p>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Full Name</label>
                            <Input
                              placeholder="Your full name"
                              {...register("passengerName")}
                              className={`h-12 bg-gray-50 border-gray-200 rounded-xl ${errors.passengerName ? "border-red-400" : ""}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Email Address</label>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...register("passengerEmail")}
                              className={`h-12 bg-gray-50 border-gray-200 rounded-xl ${errors.passengerEmail ? "border-red-400" : ""}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Phone Number</label>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 000-0000"
                              {...register("passengerPhone")}
                              className={`h-12 bg-gray-50 border-gray-200 rounded-xl ${errors.passengerPhone ? "border-red-400" : ""}`}
                            />
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Special Instructions <span className="text-gray-300 font-normal normal-case">(optional)</span>
                          </label>
                          <Textarea
                            placeholder="Child seat location, preferred route, accessibility needs, arrival sign name..."
                            {...register("specialInstructions")}
                            className="bg-gray-50 border-gray-200 rounded-xl resize-none text-sm min-h-[88px]"
                            rows={3}
                          />
                        </div>

                        {/* Booking summary */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Trip Summary</p>
                          <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-semibold text-right">{values.tripType}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Date & Time</span><span className="font-semibold text-right">{values.pickupDate} · {values.pickupTime}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Pickup</span><span className="font-semibold text-right max-w-[60%] truncate">{values.pickupLocation || "—"}</span></div>
                            {!isHourly && values.dropoffLocation && (
                              <div className="flex justify-between"><span className="text-gray-500">Drop-off</span><span className="font-semibold text-right max-w-[60%] truncate">{values.dropoffLocation}</span></div>
                            )}
                            <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="font-semibold">{vehicle?.name || "—"}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Passengers</span><span className="font-semibold">{values.passengers}</span></div>
                          </div>
                          {totalEstimate > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                              {baseRate > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>{minimumApplied ? "Minimum fare" : routeMiles !== null ? `Rate (${routeMiles.toFixed(1)} miles)` : "Rate"}</span>
                   <span>{formatUsd(baseRate)}{minimumApplied && <span className="ml-1 text-[10px] font-bold text-amber-600 uppercase tracking-wide"> MIN</span>}</span>
                </div>
              )}
                              {addonsTotal > 0 && <div className="flex justify-between text-gray-500"><span>Add-ons</span><span>+{formatUsd(addonsTotal)}</span></div>}
                              {gratuity > 0 && <div className="flex justify-between text-gray-500"><span>Gratuity (20%)</span><span>+{formatUsd(gratuity)}</span></div>}
                              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                                <span>Total Estimate</span><span>{formatUsd(totalEstimate)}</span>
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex items-start gap-2.5 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                            <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>No charge until your ride is confirmed. Final price agreed before billing.</span>
                          </div>
                        </div>
                      </div>
                    </StepPanel>
                  )}

                  {/* ═══ STEP 5 — Payment (Stripe) ═══ */}
                  {step === 5 && (
                    <StepPanel stepKey={5}>
                      <div className="mb-5">
                        <h1 className="text-xl font-bold text-gray-900">Payment</h1>
                        <p className="text-gray-400 text-sm mt-1">Your card is charged securely via Stripe.</p>
                      </div>

                      <div className="space-y-4">
                        {/* Amount summary */}
                        {totalEstimate > 0 && (
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Total due today</span>
                              <span className="text-2xl font-bold text-gray-900">{formatUsd(displayTotal)}</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                              <div className="flex justify-between">
                                <span>{minimumApplied ? "Minimum fare" : routeMiles !== null ? `Rate (${routeMiles.toFixed(1)} miles)` : "Rate"}</span>
                                <span>{formatUsd(baseRate)}{minimumApplied && <span className="ml-1 text-[10px] font-bold text-amber-600"> MIN</span>}</span>
                              </div>
                              {addonsTotal > 0 && <div className="flex justify-between"><span>Add-ons</span><span>+{formatUsd(addonsTotal)}</span></div>}
                              {gratuity > 0 && <div className="flex justify-between"><span>Gratuity (20%)</span><span>+{formatUsd(gratuity)}</span></div>}
                            </div>
                          </div>
                        )}

                        {/* Stripe payment form */}
                        {piLoading && (
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                            <p className="text-sm text-gray-400">Initialising secure payment…</p>
                          </div>
                        )}
                        {piError && (
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                            <p className="text-red-600 text-sm font-medium">{piError}</p>
                            <button
                              type="button"
                              className="mt-2 text-xs text-red-500 underline"
                              onClick={() => {
                                paymentSignatureRef.current = null;
                                setPiError(null);
                                setStep(5);
                              }}
                            >
                              Retry
                            </button>
                          </div>
                        )}
                        {bookingError && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <p className="text-amber-800 text-sm font-medium">{bookingError}</p>
                            {pendingBooking && (
                              <button
                                type="button"
                                className="mt-3 text-xs font-semibold text-amber-800 underline"
                                onClick={() => saveBooking(pendingBooking)}
                                disabled={createBooking.isPending}
                              >
                                {createBooking.isPending ? "Saving reservation…" : "Try saving reservation again"}
                              </button>
                            )}
                          </div>
                        )}
                        {clientSecret && !piLoading && (
                          <StripeCheckout
                            clientSecret={clientSecret}
                            amount={displayTotal}
                            onSuccess={(piId) => handlePaymentSuccess(piId, values as BookingFormValues)}
                            onError={(msg) => setPiError(msg)}
                          />
                        )}

                        {/* Mini trip summary */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Booking for</p>
                          <div className="flex items-center gap-3">
                            {vehicle && (
                              <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0">
                                <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{values.passengerName || "Guest"}</p>
                              <p className="text-xs text-gray-400 truncate">{values.tripType} · {vehicle?.name}</p>
                              <p className="text-xs text-gray-400">{values.pickupDate} at {values.pickupTime}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </StepPanel>
                  )}

                </AnimatePresence>

                {/* ─── Desktop nav buttons ─── */}
                <div className="hidden lg:flex items-center justify-between mt-8 gap-4">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-4 py-2.5 rounded-xl hover:bg-gray-100"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  ) : <div />}

                  {step < STEPS.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 h-12 bg-[#1A1A1A] text-white px-8 rounded-xl text-sm font-bold hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    /* Step 5 — Stripe form has its own Pay button */
                    <div />
                  )}
                </div>
              </form>
            </div>

            {/* ─── RIGHT SUMMARY PANEL (desktop) ─── */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* Trip card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-[#1A1A1A] text-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Your Trip</p>
                    <p className="font-bold">{tripType}</p>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    {values.pickupDate && (
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{values.pickupDate}{values.pickupTime ? ` · ${values.pickupTime}` : ""}</span>
                      </div>
                    )}
                    {values.pickupLocation && (
                      <div className="flex items-start gap-2.5 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="break-words">{values.pickupLocation}</span>
                      </div>
                    )}
                    {!isHourly && values.dropoffLocation && (
                      <>
                        <div className="flex justify-center"><div className="w-px h-4 bg-gray-100" /></div>
                        <div className="flex items-start gap-2.5 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="break-words">{values.dropoffLocation}</span>
                        </div>
                      </>
                    )}
                    {isHourly && (
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{values.duration || 3} hours as directed</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{values.passengers} passenger{values.passengers !== 1 ? "s" : ""} · {values.luggage} bag{values.luggage !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle card */}
                {vehicle && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-28 overflow-hidden">
                      <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-sm text-gray-900">{vehicle.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{vehicle.model}</p>
                    </div>
                  </div>
                )}

                {/* Price breakdown */}
                {totalEstimate > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Price Estimate</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>{minimumApplied ? "Minimum fare" : routeMiles !== null ? `Rate (${routeMiles.toFixed(1)} miles)` : "Rate"}</span>
                        <span>{formatUsd(baseRate)}{minimumApplied && <span className="ml-1 text-[10px] font-bold text-amber-600"> MIN</span>}</span>
                      </div>
                      {addonsTotal > 0 && <div className="flex justify-between text-gray-600"><span>Add-ons</span><span>+{formatUsd(addonsTotal)}</span></div>}
                      {gratuity > 0 && <div className="flex justify-between text-gray-600"><span>Gratuity (20%)</span><span>+{formatUsd(gratuity)}</span></div>}
                      <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 mt-2">
                        <span>Total</span><span>{formatUsd(displayTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stripe payment badge */}
                {step >= 2 && totalEstimate > 0 && (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Secure Payment</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      <strong className="text-gray-700">{formatUsd(displayTotal)}</strong> charged via Stripe — SSL encrypted.
                    </p>
                  </div>
                )}

                {/* Trust badges */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
                  {[
                    { icon: Shield, text: "No charge until confirmed" },
                    { icon: Star,   text: "5-star rated chauffeurs" },
                    { icon: Phone,  text: "24/7 dispatch support" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-gray-500">
                      <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile sticky bottom bar ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between max-w-sm mx-auto gap-4">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center active:scale-90 transition-all touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {totalEstimate > 0 ? "Estimate" : STEPS[step - 1]}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {totalEstimate > 0 ? formatUsd(displayTotal) : `Step ${step} of ${STEPS.length}`}
              </p>
            </div>
          </div>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 h-12 bg-[#1A1A1A] text-white px-7 rounded-xl text-sm font-bold shrink-0 active:scale-95 touch-manipulation"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            /* Step 5 — Stripe form handles payment */
            null
          )}
        </div>
      </div>
    </Layout>
  );
}

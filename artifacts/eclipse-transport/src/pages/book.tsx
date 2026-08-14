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
  CheckCircle2, Loader2, Plane, MapPin, Clock,
  Users, Briefcase, Plus, Minus, ArrowRight,
  Heart, Music, Trophy, Car, Church, Wind,
  ChevronLeft, Luggage, Wifi, Check, Shield, Lock,
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
    id: "suburban", name: "Chevrolet Suburban", model: "2025",
    category: "SUV", pax: 7, bags: 6,
    ratePerMile: BOOKING_VEHICLES.suburban.ratePerMile,
    hourlyRate: BOOKING_VEHICLES.suburban.hourlyRate,
    minimumFare: BOOKING_VEHICLES.suburban.minimumFare,
    image: suburbanImg,
    amenities: ["Wi-Fi", "Privacy glass", "Climate control", "Water"],
  },
  {
    id: "escalade", name: "Cadillac Escalade", model: "2024 ESV",
    category: "SUV", pax: 7, bags: 6,
    ratePerMile: BOOKING_VEHICLES.escalade.ratePerMile,
    hourlyRate: BOOKING_VEHICLES.escalade.hourlyRate,
    minimumFare: BOOKING_VEHICLES.escalade.minimumFare,
    image: escaladeImg,
    amenities: ["Panoramic sunroof", "Premium audio", "Heated seats"],
  },
  {
    id: "lincoln", name: "Lincoln Continental", model: "2024",
    category: "Sedan", pax: 3, bags: 3,
    ratePerMile: BOOKING_VEHICLES.lincoln.ratePerMile,
    hourlyRate: BOOKING_VEHICLES.lincoln.hourlyRate,
    minimumFare: BOOKING_VEHICLES.lincoln.minimumFare,
    image: lincolnImg,
    amenities: ["Executive seating", "Noise cancellation"],
  },
  {
    id: "mercedes", name: "Mercedes S-Class", model: "2024",
    category: "Sedan", pax: 3, bags: 3,
    ratePerMile: BOOKING_VEHICLES.mercedes.ratePerMile,
    hourlyRate: BOOKING_VEHICLES.mercedes.hourlyRate,
    minimumFare: BOOKING_VEHICLES.mercedes.minimumFare,
    image: mercedesImg,
    amenities: ["Massaging seats", "Burmester audio"],
  },
];

const tripTypes = [
  { id: "Airport Transfer",   icon: Plane,     title: "Airport",       desc: "LAX · BUR · LGB · SNA · ONT" },
  { id: "Corporate Travel",   icon: Briefcase, title: "Corporate",     desc: "Executive transfers & roadshows" },
  { id: "By the Hour",        icon: Clock,     title: "By the Hour",   desc: "3–12 hrs anywhere in LA" },
  { id: "Around Town",        icon: MapPin,    title: "Point-to-Point",desc: "Custom routes across LA" },
  { id: "Date Night",         icon: Heart,     title: "Date Night",    desc: "Romantic evening experience" },
  { id: "Concerts",           icon: Music,     title: "Events",        desc: "Concerts, shows & sporting events" },
  { id: "Wedding",            icon: Church,    title: "Wedding",       desc: "Bridal fleet service" },
  { id: "Prom",               icon: Car,       title: "Prom",          desc: "Safe & stylish prom night" },
  { id: "Sports Events",      icon: Trophy,    title: "Sports",        desc: "SoFi, Staples, Dodger Stadium" },
  { id: "Air Transportation", icon: Wind,      title: "Private Air",   desc: "FBO & private aviation transfers" },
];

const addons = [
  { id: "addonMeetGreet",    label: "Meet & Greet",      desc: "Chauffeur meets you at the gate",        price: BOOKING_ADDON_PRICES.meetGreet },
  { id: "addonChildSeat",    label: "Child Safety Seat", desc: "Certified car seat included",             price: BOOKING_ADDON_PRICES.childSeat },
  { id: "addonFlowers",      label: "Welcome Flowers",   desc: "Seasonal bouquet on arrival",             price: BOOKING_ADDON_PRICES.flowers },
  { id: "addonFlightMonitor",label: "Flight Monitoring", desc: "Real-time tracking — no extra charge",    price: 0, included: true },
];

const formatUsd = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const createPaymentIdempotencyKey = () => {
  const r =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `eclipse-booking-${r}`;
};

/* ─────────────────────────── schema ─────────────────────────── */

const bookingSchema = z.object({
  tripType:            z.string().min(1),
  pickupDate:          z.string().trim().min(1, "Select a pickup date"),
  pickupTime:          z.string().trim().min(1, "Select a pickup time"),
  pickupLocation:      z.string().trim().min(1, "Enter pickup location"),
  dropoffLocation:     z.string().optional(),
  flightNumber:        z.string().optional(),
  airline:             z.string().optional(),
  terminal:            z.string().optional(),
  duration:            z.coerce.number().min(1).max(12).optional(),
  returnTrip:          z.boolean().optional(),
  passengers:          z.coerce.number().min(1).max(14),
  luggage:             z.coerce.number().min(0).max(10),
  vehicleId:           z.string().optional(),
  passengerName:       z.string().trim().min(2, "Enter your full name"),
  passengerEmail:      z.string().trim().email("Enter a valid email"),
  passengerPhone:      z.string().trim().min(7, "Enter a valid phone number"),
  addonMeetGreet:      z.boolean().optional(),
  addonChildSeat:      z.boolean().optional(),
  addonFlowers:        z.boolean().optional(),
  addonFlightMonitor:  z.boolean().optional(),
  extraStops:          z.coerce.number().min(0).max(10).optional(),
  specialInstructions: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tripType !== "By the Hour" && !data.dropoffLocation?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dropoffLocation"], message: "Enter drop-off location" });
  }
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const STEPS = ["Service", "Details", "Vehicle", "You", "Payment"];

/* ─────────────────────────── sub-components ─────────────────────────── */

function Counter({
  value, onChange, min = 0, max = 14, label, note,
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; label: string; note?: string;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-[15px] font-medium text-gray-900">{label}</p>
        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 touch-manipulation"
        >
          <Minus className="w-4 h-4 text-gray-500" />
        </button>
        <span className="w-5 text-center text-base font-semibold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 touch-manipulation"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepPanel({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── main ─────────────────────────── */

export default function Book() {
  const searchParams   = new URLSearchParams(window.location.search);
  const defaultService = searchParams.get("service") || "Airport Transfer";
  const defaultVehicle = searchParams.get("vehicle") || "";

  const [step, setStep]                     = useState(1);
  const [isSuccess, setIsSuccess]           = useState(false);
  const [clientSecret, setClientSecret]     = useState<string | null>(null);
  const stripePublishableKey =
    (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() || null;
  const [paymentAmount, setPaymentAmount]   = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [piLoading, setPiLoading]           = useState(false);
  const [piError, setPiError]               = useState<string | null>(null);
  const [pickupPoint, setPickupPoint]       = useState<GooglePlaceSelection | null>(null);
  const [dropoffPoint, setDropoffPoint]     = useState<GooglePlaceSelection | null>(null);
  const [routeMiles, setRouteMiles]         = useState<number | null>(null);
  const [routeStatus, setRouteStatus]       = useState<"idle" | "calculating" | "ready" | "error">("idle");
  const [routeError, setRouteError]         = useState<string | null>(null);
  const [bookingError, setBookingError]     = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<BookingInput | null>(null);
  const paymentSignatureRef                 = useRef<string | null>(null);
  const paymentIdempotencyKeyRef            = useRef<{ signature: string; key: string } | null>(null);
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

  const values            = watch();
  const tripType          = values.tripType;
  const isHourly          = tripType === "By the Hour";
  const isAirport         = tripType === "Airport Transfer";
  const vehicle           = vehicles.find(v => v.id === values.vehicleId);
  const selectedTripType  = tripTypes.find(t => t.id === tripType);

  /* distance calculation */
  useEffect(() => {
    if (isHourly) { setRouteMiles(null); setRouteStatus("idle"); setRouteError(null); return; }
    if (!pickupPoint || !dropoffPoint) { setRouteMiles(null); setRouteStatus("idle"); setRouteError(null); return; }

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
          setRouteError("Couldn't calculate distance. Select both addresses from the dropdown suggestions.");
          return;
        }
        setRouteMiles(element.distance.value / 1609.344);
        setRouteStatus("ready");
      },
    );
    return () => { cancelled = true; };
  }, [dropoffPoint, isHourly, pickupPoint]);

  /* price */
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
  const displayTotal    = paymentAmount ?? totalEstimate;
  const paymentSignature = [
    totalEstimate, values.passengerEmail, values.tripType, values.vehicleId,
    values.duration, routeMiles, values.addonMeetGreet, values.addonChildSeat,
    values.addonFlowers, values.extraStops,
  ].join("|");

  /* navigation */
  const handleNext = async () => {
    let fields: (keyof BookingFormValues)[] = [];
    if (step === 2) {
      fields = ["pickupDate", "pickupTime", "pickupLocation"];
      if (!isHourly) fields.push("dropoffLocation");
      if (!isHourly && (routeMiles === null || routeStatus !== "ready")) {
        setRouteError("Select both locations from the address suggestions so we can calculate the driving distance.");
        return;
      }
    }
    if (step === 3 && !values.vehicleId) return;
    if (step === 4) fields = ["passengerName", "passengerEmail", "passengerPhone"];
    const ok = await trigger(fields);
    if (ok) { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const handleBack = () => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* Stripe payment intent */
  useEffect(() => {
    if (step !== 5 || totalEstimate <= 0) return;
    if (paymentSignatureRef.current === paymentSignature) return;
    paymentSignatureRef.current = paymentSignature;
    if (paymentIdempotencyKeyRef.current?.signature !== paymentSignature) {
      paymentIdempotencyKeyRef.current = { signature: paymentSignature, key: createPaymentIdempotencyKey() };
    }
    const idempotencyKey = paymentIdempotencyKeyRef.current.key;
    const controller = new AbortController();
    setClientSecret(null);
    setPaymentIntentId(null);
    setPaymentAmount(null);
    setPiLoading(true);
    setPiError(null);

    if (!stripePublishableKey) {
      setPiError("Payment is not configured. Please contact dispatch.");
      setPiLoading(false);
      return;
    }

    const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
    const readJson = async <T,>(response: Response): Promise<T> => {
      const data = (await response.json().catch(() => ({}))) as T & { error?: string };
      if (!response.ok) throw new Error(data.error ?? `Payment setup failed (${response.status}).`);
      return data;
    };

    fetch(`${apiBase}/api/stripe/payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: Math.round(totalEstimate * 100),
        idempotencyKey,
        quote: {
          vehicleId:      values.vehicleId || "",
          tripType:       values.tripType,
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
          serviceType:   values.tripType || "",
          pickupDate:    values.pickupDate || "",
          routeMiles:    routeMiles?.toFixed(2) || "",
        },
      }),
      signal: controller.signal,
    })
      .then(r => readJson<{ clientSecret: string; amount?: number }>(r))
      .then(data => {
        setClientSecret(data.clientSecret);
        setPaymentAmount(typeof data.amount === "number" ? data.amount : totalEstimate);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        paymentSignatureRef.current = null;
        setPiError(error instanceof Error ? error.message : "Unable to initialize payment. Please try again.");
      })
      .finally(() => { if (!controller.signal.aborted) setPiLoading(false); });

    return () => controller.abort();
  }, [paymentSignature, step, stripePublishableKey, totalEstimate]); // eslint-disable-line

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
          error instanceof Error ? error.message
            : "Payment received but reservation save failed. Please call dispatch with your payment reference.",
        );
      },
    });
  };

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
    if (routeMiles !== null)        reqs.push(`Distance: ${routeMiles.toFixed(1)} miles`);
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

  const onSubmit = (_data: BookingFormValues) => {};

  /* ─── Success screen ─── */
  if (isSuccess) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Thank you, <strong>{values.passengerName}</strong>. A confirmation has been sent to{" "}
            <span className="font-medium">{values.passengerEmail}</span>.
          </p>
        </motion.div>

        {totalEstimate > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="w-full max-w-sm mt-8 bg-gray-50 rounded-2xl p-5 text-left"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Summary</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Service</span><span className="font-medium">{values.tripType}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Vehicle</span><span className="font-medium">{vehicle?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Date & Time</span><span className="font-medium">{values.pickupDate} · {values.pickupTime}</span></div>
              <div className="border-t border-gray-200 pt-3 mt-1 flex justify-between font-bold text-base">
                <span>Total Charged</span><span>{formatUsd(displayTotal)}</span>
              </div>
            </div>
            {paymentIntentId && (
              <p className="mt-3 text-[10px] text-gray-300 font-mono break-all">Ref: {paymentIntentId}</p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="w-full max-w-sm mt-6"
        >
          <a href="/"
            className="block w-full py-4 bg-black text-white rounded-2xl text-sm font-semibold text-center hover:bg-gray-900 transition-colors">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  /* ─── Progress bar ─── */
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-dvh bg-white flex flex-col">

      {/* ── Top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 h-14">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          ) : (
            <a href="/">
              <img src={eclipseLogoTransparent} alt="Eclipse Transport" className="h-8 w-auto" />
            </a>
          )}

          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
            {STEPS[step - 1]}
          </p>

          <span className="text-xs text-gray-300 font-medium w-9 text-right">{step}/{STEPS.length}</span>
        </div>
        <div className="h-[2px] bg-gray-100">
          <motion.div
            className="h-full bg-black origin-left"
            animate={{ scaleX: progress / 100 }}
            initial={false}
            style={{ transformOrigin: "left" }}
            transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 pt-[58px] pb-28">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">

            {/* ══════════ STEP 1 — Service ══════════ */}
            {step === 1 && (
              <StepPanel stepKey={1}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[30px] font-bold tracking-tight text-gray-900 leading-[1.15]">
                    What's the<br />occasion?
                  </h1>
                  <p className="text-gray-400 text-[13px] mt-2">Choose the service that fits your trip.</p>
                </div>

                {/* Scrollable service chips */}
                <div className="flex gap-2.5 overflow-x-auto pb-1 px-5 scrollbar-none">
                  {tripTypes.map(t => {
                    const Icon = t.icon;
                    const sel = tripType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setValue("tripType", t.id)}
                        className={`flex-none flex flex-col items-center gap-2 px-4 pt-4 pb-3.5 rounded-2xl transition-all duration-200 touch-manipulation active:scale-95 min-w-[76px]
                          ${sel
                            ? "bg-black text-white shadow-lg shadow-black/20"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                      >
                        <Icon className={`w-[22px] h-[22px] ${sel ? "text-white" : "text-gray-400"}`} strokeWidth={1.6} />
                        <span className="text-[10px] font-bold whitespace-nowrap leading-tight text-center uppercase tracking-wide">
                          {t.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected service description */}
                <AnimatePresence mode="wait">
                  {selectedTripType && (
                    <motion.div
                      key={selectedTripType.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mx-5 mt-4"
                    >
                      <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-4 bg-white shadow-sm">
                        <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center shrink-0">
                          <selectedTripType.icon className="w-5 h-5 text-white" strokeWidth={1.7} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-[15px]">{selectedTripType.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{selectedTripType.desc}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Group size */}
                <div className="mx-5 mt-4 bg-gray-50 rounded-2xl px-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-4 pb-1">Group Size</p>
                  <Counter label="Passengers" note="Max 7 per vehicle"
                    value={values.passengers} onChange={v => setValue("passengers", v)} min={1} max={14} />
                  <Counter label="Bags" note="Checked + carry-on"
                    value={values.luggage} onChange={v => setValue("luggage", v)} min={0} max={10} />
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 2 — Trip Details ══════════ */}
            {step === 2 && (
              <StepPanel stepKey={2}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[30px] font-bold tracking-tight text-gray-900 leading-[1.15]">
                    When &<br />where?
                  </h1>
                  <p className="text-gray-400 text-[13px] mt-2">All times are local Los Angeles time.</p>
                </div>

                <div className="px-5 space-y-3">

                  {/* Date & Time */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Date & Time</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Pickup Date</label>
                        <Input type="date" {...register("pickupDate")}
                          className={`h-12 bg-white border-gray-200 rounded-xl text-sm font-medium ${errors.pickupDate ? "border-red-400" : ""}`} />
                        {errors.pickupDate && <p className="text-xs text-red-500 mt-1">{errors.pickupDate.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Pickup Time</label>
                        <Input type="time" {...register("pickupTime")}
                          className={`h-12 bg-white border-gray-200 rounded-xl text-sm font-medium ${errors.pickupTime ? "border-red-400" : ""}`} />
                        {errors.pickupTime && <p className="text-xs text-red-500 mt-1">{errors.pickupTime.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Duration (hourly) */}
                  {isHourly && (
                    <div className="bg-gray-50 rounded-2xl px-5">
                      <Counter
                        label="Duration"
                        note={`${values.duration || 3} hour${(values.duration || 3) > 1 ? "s" : ""} · minimum 3 hours`}
                        value={values.duration || 3}
                        onChange={v => setValue("duration", v)}
                        min={3} max={12}
                      />
                    </div>
                  )}

                  {/* Locations — Uber/Lyft style */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Locations</p>
                    <div className="relative">
                      {/* Connecting line */}
                      {!isHourly && (
                        <div className="absolute left-[7px] top-[24px] h-[calc(100%-52px)] w-0.5 bg-gray-200 z-0" />
                      )}
                      <div className="space-y-2 relative z-10">
                        {/* Pickup */}
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-black bg-white shrink-0" />
                          <div className="flex-1">
                            <Controller name="pickupLocation" control={control}
                              render={({ field }) => (
                                <GooglePlacesInput
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  onPlaceSelect={setPickupPoint}
                                  placeholder="Pickup address"
                                  className={`h-12 bg-white border-gray-200 rounded-xl text-sm ${errors.pickupLocation ? "border-red-400" : ""}`}
                                />
                              )}
                            />
                            {errors.pickupLocation && <p className="text-xs text-red-500 mt-1">{errors.pickupLocation.message}</p>}
                          </div>
                        </div>

                        {/* Drop-off */}
                        {!isHourly && (
                          <div className="flex items-center gap-3">
                            <div className="w-3.5 h-3.5 rounded-sm bg-black shrink-0" />
                            <div className="flex-1">
                              <Controller name="dropoffLocation" control={control}
                                render={({ field }) => (
                                  <GooglePlacesInput
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    onPlaceSelect={setDropoffPoint}
                                    placeholder="Drop-off address"
                                    className={`h-12 bg-white border-gray-200 rounded-xl text-sm ${errors.dropoffLocation ? "border-red-400" : ""}`}
                                  />
                                )}
                              />
                              {errors.dropoffLocation && <p className="text-xs text-red-500 mt-1">{errors.dropoffLocation.message}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Distance status pill */}
                    {!isHourly && (
                      <div className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2 ${
                        routeStatus === "error" ? "bg-red-50 text-red-600"
                          : routeStatus === "ready" ? "bg-green-50 text-green-700"
                          : routeStatus === "calculating" ? "bg-gray-100 text-gray-500"
                          : "bg-white border border-gray-100 text-gray-400"
                      }`}>
                        {routeStatus === "calculating" && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                        {routeStatus === "ready" && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />}
                        <span>
                          {routeStatus === "calculating" && "Calculating route…"}
                          {routeStatus === "ready" && routeMiles !== null && `${routeMiles.toFixed(1)} mi · Route confirmed`}
                          {routeStatus === "error" && (routeError || "Route error")}
                          {routeStatus === "idle" && "Select both locations to confirm your route"}
                        </span>
                      </div>
                    )}

                    {/* Extra stops */}
                    <div className={!isHourly ? "border-t border-gray-100 mt-3" : "mt-1"}>
                      <Counter label="Extra Stops" note="$15 per additional stop"
                        value={values.extraStops || 0} onChange={v => setValue("extraStops", v)} min={0} max={5} />
                    </div>
                  </div>

                  {/* Flight info (airport only) */}
                  {isAirport && (
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                        Flight Info <span className="text-gray-300 font-normal normal-case ml-1">· optional</span>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Airline</label>
                          <Input placeholder="Delta" {...register("airline")}
                            className="h-12 bg-white border-gray-200 rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Flight #</label>
                          <Input placeholder="DL 234" {...register("flightNumber")}
                            className="h-12 bg-white border-gray-200 rounded-xl text-sm" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-2">Terminal</label>
                          <Input placeholder="e.g. Terminal 4 / Tom Bradley" {...register("terminal")}
                            className="h-12 bg-white border-gray-200 rounded-xl text-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 3 — Vehicle ══════════ */}
            {step === 3 && (
              <StepPanel stepKey={3}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[30px] font-bold tracking-tight text-gray-900 leading-[1.15]">
                    Choose<br />your ride
                  </h1>
                  <p className="text-gray-400 text-[13px] mt-2">All vehicles are insured & professionally chauffeured.</p>
                </div>

                {/* Horizontal swipeable vehicle cards */}
                <div className="flex gap-3 overflow-x-auto pb-3 px-5 scrollbar-none snap-x snap-mandatory">
                  {vehicles.map(v => {
                    const selected = values.vehicleId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setValue("vehicleId", v.id)}
                        className={`flex-none w-[72vw] max-w-[280px] snap-start rounded-3xl overflow-hidden text-left transition-all duration-200 touch-manipulation active:scale-[0.97]
                          ${selected
                            ? "ring-2 ring-black shadow-xl shadow-black/10"
                            : "ring-1 ring-gray-100 shadow-sm"}`}
                      >
                        <div className="relative h-44 bg-gray-100 overflow-hidden">
                          <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                          {selected && (
                            <div className="absolute top-3 right-3 w-7 h-7 bg-black rounded-full flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                          )}
                          <div className="absolute bottom-3 left-3">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full
                              ${selected ? "bg-black text-white" : "bg-white/90 text-gray-600"}`}>
                              {v.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-white">
                          <p className="font-bold text-gray-900 text-[15px]">{v.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{v.model}</p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {v.pax} pax</span>
                            <span className="flex items-center gap-1.5"><Luggage className="w-3.5 h-3.5" /> {v.bags} bags</span>
                            <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> Wi-Fi</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {v.amenities.map(a => (
                              <span key={a} className="text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5 text-gray-500">{a}</span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!values.vehicleId && (
                  <p className="text-center text-xs text-red-500 mt-1 px-5 font-medium">Swipe and select a vehicle to continue</p>
                )}

                {/* Add-ons */}
                <div className="mx-5 mt-4 bg-gray-50 rounded-2xl px-5 py-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-4 pb-2">Add-ons</p>
                  {addons.map(addon => {
                    const key = addon.id as keyof BookingFormValues;
                    const checked = !!values[key];
                    return (
                      <div
                        key={addon.id}
                        onClick={() => !addon.included && setValue(key, !checked as any)}
                        className={`flex items-center justify-between py-4 border-b border-gray-100 last:border-0 transition-opacity
                          ${!addon.included ? "cursor-pointer active:opacity-60 touch-manipulation" : "opacity-60"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0
                            ${checked ? "bg-black" : "border-2 border-gray-200"}`}>
                            {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-gray-900">{addon.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{addon.desc}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ml-4 shrink-0 ${addon.included ? "text-green-600" : "text-gray-700"}`}>
                          {addon.included ? "Free" : `+$${addon.price}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 4 — Your Info ══════════ */}
            {step === 4 && (
              <StepPanel stepKey={4}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[30px] font-bold tracking-tight text-gray-900 leading-[1.15]">
                    About<br />you
                  </h1>
                  <p className="text-gray-400 text-[13px] mt-2">Your chauffeur will have this info.</p>
                </div>

                <div className="px-5 space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Full Name</label>
                      <Input placeholder="Your full name" {...register("passengerName")}
                        className={`h-12 bg-white border-gray-200 rounded-xl text-[15px] ${errors.passengerName ? "border-red-400" : ""}`} />
                      {errors.passengerName && <p className="text-xs text-red-500 mt-1">{errors.passengerName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Email</label>
                      <Input type="email" placeholder="you@example.com" {...register("passengerEmail")}
                        className={`h-12 bg-white border-gray-200 rounded-xl text-[15px] ${errors.passengerEmail ? "border-red-400" : ""}`} />
                      {errors.passengerEmail && <p className="text-xs text-red-500 mt-1">{errors.passengerEmail.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Phone</label>
                      <Input type="tel" placeholder="+1 (555) 000-0000" {...register("passengerPhone")}
                        className={`h-12 bg-white border-gray-200 rounded-xl text-[15px] ${errors.passengerPhone ? "border-red-400" : ""}`} />
                      {errors.passengerPhone && <p className="text-xs text-red-500 mt-1">{errors.passengerPhone.message}</p>}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5">
                    <label className="block text-xs font-medium text-gray-400 mb-3">
                      Special Instructions <span className="text-gray-300">· optional</span>
                    </label>
                    <Textarea
                      placeholder="Accessibility needs, preferred route, name for pickup sign, etc."
                      {...register("specialInstructions")}
                      className="bg-white border-gray-200 rounded-xl resize-none text-sm min-h-[80px]"
                      rows={3}
                    />
                  </div>

                  {/* Brief trip summary (no price) */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Trip Summary</p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Service</span><span className="font-medium text-gray-800">{values.tripType}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Vehicle</span><span className="font-medium text-gray-800">{vehicle?.name || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Date</span><span className="font-medium text-gray-800">{values.pickupDate || "—"} · {values.pickupTime || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Passengers</span><span className="font-medium text-gray-800">{values.passengers}</span></div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 bg-white rounded-xl p-3 text-xs text-gray-400 border border-gray-100">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span>Your total price will be shown on the next screen before any charge.</span>
                    </div>
                  </div>
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 5 — Payment ══════════ */}
            {step === 5 && (
              <StepPanel stepKey={5}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[30px] font-bold tracking-tight text-gray-900 leading-[1.15]">
                    Review<br />&amp; Pay
                  </h1>
                  <p className="text-gray-400 text-[13px] mt-2">Secured by Stripe · 256-bit SSL encryption.</p>
                </div>

                <div className="px-5 space-y-3">
                  {/* Price reveal — black card */}
                  {totalEstimate > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                      className="bg-black rounded-3xl p-6 text-white"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Total Due Today</p>
                      <p className="text-5xl font-bold tracking-tight tabular-nums">{formatUsd(displayTotal)}</p>
                      <div className="mt-5 pt-5 border-t border-white/10 space-y-2 text-sm text-white/50">
                        <div className="flex justify-between">
                          <span>{minimumApplied ? "Minimum fare" : routeMiles !== null ? `Ride (${routeMiles.toFixed(1)} mi)` : "Base rate"}</span>
                          <span className="text-white/80 font-medium">{formatUsd(baseRate)}</span>
                        </div>
                        {addonsTotal > 0 && (
                          <div className="flex justify-between">
                            <span>Add-ons</span>
                            <span className="text-white/80 font-medium">+{formatUsd(addonsTotal)}</span>
                          </div>
                        )}
                        {gratuity > 0 && (
                          <div className="flex justify-between">
                            <span>Gratuity (20%)</span>
                            <span className="text-white/80 font-medium">+{formatUsd(gratuity)}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Booking for — mini card */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      {vehicle && (
                        <div className="w-14 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-200">
                          <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{values.passengerName || "Guest"}</p>
                        <p className="text-xs text-gray-400 truncate">{values.tripType} · {vehicle?.name}</p>
                        <p className="text-xs text-gray-400">{values.pickupDate} at {values.pickupTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Loading state */}
                  {piLoading && (
                    <div className="bg-gray-50 rounded-2xl p-10 flex flex-col items-center gap-3">
                      <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
                      <p className="text-sm text-gray-400">Preparing secure payment…</p>
                    </div>
                  )}

                  {/* Stripe error */}
                  {piError && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                      <p className="text-red-600 text-sm font-medium">{piError}</p>
                      <button type="button" className="mt-2 text-xs text-red-500 underline"
                        onClick={() => { paymentSignatureRef.current = null; setPiError(null); setStep(5); }}>
                        Try again
                      </button>
                    </div>
                  )}

                  {/* Booking save error */}
                  {bookingError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-amber-800 text-sm font-medium">{bookingError}</p>
                      {pendingBooking && (
                        <button type="button" className="mt-2 text-xs font-semibold text-amber-700 underline"
                          onClick={() => saveBooking(pendingBooking)} disabled={createBooking.isPending}>
                          {createBooking.isPending ? "Saving…" : "Try saving again"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Stripe checkout form */}
                  {clientSecret && !piLoading && (
                    <StripeCheckout
                      clientSecret={clientSecret}
                      publishableKey={stripePublishableKey ?? ""}
                      amount={displayTotal}
                      onSuccess={(piId) => handlePaymentSuccess(piId, values as BookingFormValues)}
                      onError={(msg) => setPiError(msg)}
                    />
                  )}

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-6 py-2">
                    {[
                      { icon: Shield, text: "No charge until confirmed" },
                      { icon: Lock, text: "SSL secured" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </StepPanel>
            )}

          </AnimatePresence>
        </form>
      </div>

      {/* ── Fixed bottom CTA (steps 1–4 only) ── */}
      {step < STEPS.length && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-14 bg-black text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform touch-manipulation shadow-lg shadow-black/20"
          >
            {step === STEPS.length - 1 ? "Review & Pay" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

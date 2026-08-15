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
  CheckCircle2, Loader2, Clock, MapPin, Check,
  Users, Plus, Minus, Luggage, Wifi, ChevronLeft,
  ChevronRight, Car
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
    image: suburbanImg,
    amenities: ["Wi-Fi", "Privacy glass", "Climate control", "Water"],
  },
  {
    id: "escalade", name: "Cadillac Escalade", model: "2024 ESV",
    category: "SUV", pax: 7, bags: 6,
    image: escaladeImg,
    amenities: ["Panoramic sunroof", "Premium audio", "Heated seats"],
  },
  {
    id: "lincoln", name: "Lincoln Continental", model: "2024",
    category: "Sedan", pax: 3, bags: 3,
    image: lincolnImg,
    amenities: ["Executive seating", "Noise cancellation"],
  },
  {
    id: "mercedes", name: "Mercedes S-Class", model: "2024",
    category: "Sedan", pax: 3, bags: 3,
    image: mercedesImg,
    amenities: ["Massaging seats", "Burmester audio"],
  },
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
  bookingMode:         z.enum(["transfer", "hourly"]),
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
  addonMeetGreet:      z.boolean().optional(),
  addonChildSeat:      z.boolean().optional(),
  extraStops:          z.coerce.number().min(0).max(10).optional(),
  specialInstructions: z.string().optional(),

  passengerName:       z.string().trim().min(2, "Enter your full name"),
  passengerEmail:      z.string().trim().email("Enter a valid email"),
  passengerPhone:      z.string().trim().min(7, "Enter a valid phone number"),
}).superRefine((data, ctx) => {
  if (data.bookingMode === "transfer" && !data.dropoffLocation?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dropoffLocation"], message: "Enter drop-off location" });
  }
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const STEPS = ["Route", "Vehicle", "Extras", "Details", "Payment"];

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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── main ─────────────────────────── */

export default function Book() {
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
  const paymentSignatureRef                 = useRef<string | null>(null);
  const paymentIdempotencyKeyRef            = useRef<{ signature: string; key: string } | null>(null);
  const queryClient   = useQueryClient();
  const createBooking = useCreateBooking();

  const { register, handleSubmit, watch, setValue, trigger, control, formState: { errors } } =
    useForm<BookingFormValues>({
      resolver: zodResolver(bookingSchema),
      defaultValues: {
        bookingMode:        "transfer",
        passengers:         1,
        luggage:            1,
        duration:           3,
        extraStops:         0,
        addonMeetGreet:     false,
        addonChildSeat:     false,
      },
      mode: "onChange",
    });

  const values   = watch();
  const isHourly = values.bookingMode === "hourly";
  const vehicle  = vehicles.find(v => v.id === values.vehicleId);

  // The backend uses "By the Hour" strictly to price hourly trips
  const computedTripType = isHourly ? "By the Hour" : "Point-to-Point";

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
          setRouteError("Couldn't calculate distance. Select both addresses from the dropdown.");
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
    tripType: computedTripType,
    duration: values.duration,
    routeMiles,
    addonMeetGreet: values.addonMeetGreet,
    addonChildSeat: values.addonChildSeat,
    extraStops: values.extraStops,
  });
  const totalEstimate   = priceBreakdown.total;
  const displayTotal    = paymentAmount ?? totalEstimate;
  const paymentSignature = [
    totalEstimate, values.passengerEmail, computedTripType, values.vehicleId,
    values.duration, routeMiles, values.addonMeetGreet, values.addonChildSeat,
    values.extraStops,
  ].join("|");

  /* navigation */
  const handleNext = async () => {
    let fields: (keyof BookingFormValues)[] = [];
    if (step === 1) {
      fields = ["pickupDate", "pickupTime", "pickupLocation"];
      if (!isHourly) fields.push("dropoffLocation");
      const ok = await trigger(fields);
      if (ok && !isHourly && routeStatus !== "ready") {
        setRouteError("Select both locations from the suggestions to confirm route.");
        return;
      }
      if (!ok) return;
    }
    if (step === 2 && !values.vehicleId) return;
    if (step === 3) {
      fields = ["passengers", "luggage", "extraStops"];
      if (!(await trigger(fields))) return;
    }
    if (step === 4) {
      fields = ["passengerName", "passengerEmail", "passengerPhone"];
      if (!(await trigger(fields))) return;
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    fetch(`${apiBase}/api/stripe/payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: Math.round(totalEstimate * 100),
        idempotencyKey,
        quote: {
          vehicleId:      values.vehicleId || "",
          tripType:       computedTripType,
          duration:       values.duration,
          routeMiles,
          addonMeetGreet: values.addonMeetGreet,
          addonChildSeat: values.addonChildSeat,
          extraStops:     values.extraStops,
        },
        customerEmail: values.passengerEmail,
        metadata: {
          passengerName: values.passengerName || "Guest",
          serviceType:   computedTripType,
          pickupDate:    values.pickupDate || "",
          routeMiles:    routeMiles?.toFixed(2) || "",
        },
      }),
      signal: controller.signal,
    })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Payment setup failed.");
        return data;
      })
      .then(data => {
        setClientSecret(data.clientSecret);
        setPaymentAmount(typeof data.amount === "number" ? data.amount : totalEstimate);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        paymentSignatureRef.current = null;
        setPiError(error instanceof Error ? error.message : "Unable to initialize payment.");
      })
      .finally(() => { if (!controller.signal.aborted) setPiLoading(false); });

    return () => controller.abort();
  }, [paymentSignature, step, stripePublishableKey, totalEstimate, computedTripType, routeMiles, values]);

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
            : "Payment received but reservation save failed. Please call dispatch.",
        );
      },
    });
  };

  const handlePaymentSuccess = (piId: string, data: BookingFormValues) => {
    setPaymentIntentId(piId);
    const reqs: string[] = [];
    if (data.addonMeetGreet)        reqs.push("Meet & Greet (+$25)");
    if (data.addonChildSeat)        reqs.push("Child Seat (+$20)");
    if ((data.extraStops || 0) > 0) reqs.push(`${data.extraStops} extra stop(s)`);
    if (data.specialInstructions)   reqs.push(`Notes: ${data.specialInstructions}`);
    if (data.flightNumber)          reqs.push(`Flight: ${data.airline || ""} ${data.flightNumber}`);
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
      serviceType:     computedTripType,
      specialRequests: reqs.join(" | "),
      estimatedPrice:  displayTotal,
    };
    saveBooking(bookingData);
  };

  const onSubmit = () => {};

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
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="w-full max-w-sm mt-6"
        >
          <a href="/" className="block w-full py-4 bg-black text-white rounded-2xl text-sm font-semibold text-center hover:bg-gray-900 transition-colors">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
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
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
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
      <div className="flex-1 pt-[58px] pb-32">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">

            {/* ══════════ STEP 1 — Route (Uber-style) ══════════ */}
            {step === 1 && (
              <StepPanel stepKey={1}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
                    Where to?
                  </h1>
                </div>

                {/* Mode Toggle */}
                <div className="px-5 mb-6">
                  <div className="flex bg-gray-100 rounded-xl p-1 relative">
                    <button
                      type="button"
                      onClick={() => setValue("bookingMode", "transfer")}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${!isHourly ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Point-to-Point
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("bookingMode", "hourly")}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${isHourly ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      By the Hour
                    </button>
                    <motion.div
                      layout
                      className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
                      animate={{ left: isHourly ? "calc(50% + 2px)" : "4px" }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  </div>
                </div>

                <div className="px-5 space-y-4">
                  {/* Locations */}
                  <div className="bg-gray-50 rounded-2xl p-5 relative">
                    {!isHourly && (
                      <div className="absolute left-[26px] top-[46px] h-[48px] w-0.5 bg-gray-200 z-0" />
                    )}
                    <div className="space-y-4 relative z-10">
                      {/* Pickup */}
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />
                        <div className="flex-1">
                          <Controller name="pickupLocation" control={control}
                            render={({ field }) => (
                              <GooglePlacesInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                onPlaceSelect={setPickupPoint}
                                placeholder="Pickup location"
                                className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium focus:ring-2 focus:ring-black ${errors.pickupLocation ? "border-red-400" : ""}`}
                              />
                            )}
                          />
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
                                  placeholder="Where to?"
                                  className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium focus:ring-2 focus:ring-black ${errors.dropoffLocation ? "border-red-400" : ""}`}
                                />
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distance Status */}
                  {!isHourly && (
                    <div className="px-1 text-xs font-medium text-gray-500 min-h-5">
                      {routeStatus === "calculating" && <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating route...</span>}
                      {routeStatus === "ready" && routeMiles !== null && <span className="text-green-600 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Route verified: {routeMiles.toFixed(1)} miles</span>}
                      {routeStatus === "error" && <span className="text-red-500">{routeError}</span>}
                    </div>
                  )}

                  {/* Hourly Duration */}
                  {isHourly && (
                    <div className="bg-gray-50 rounded-2xl px-5 py-2">
                      <Counter
                        label="Duration"
                        note="Minimum 3 hours"
                        value={values.duration || 3}
                        onChange={v => setValue("duration", v)}
                        min={3} max={12}
                      />
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Date</label>
                        <Input type="date" {...register("pickupDate")} className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium ${errors.pickupDate ? "border-red-400" : ""}`} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Time</label>
                        <Input type="time" {...register("pickupTime")} className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm font-medium ${errors.pickupTime ? "border-red-400" : ""}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 2 — Vehicle ══════════ */}
            {step === 2 && (
              <StepPanel stepKey={2}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
                    Choose a ride
                  </h1>
                </div>

                <div className="px-5 space-y-4">
                  {vehicles.map(v => {
                    const selected = values.vehicleId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setValue("vehicleId", v.id)}
                        className={`w-full text-left rounded-3xl overflow-hidden transition-all duration-200 touch-manipulation relative
                          ${selected ? "ring-2 ring-black shadow-lg" : "ring-1 ring-gray-200 shadow-sm bg-white"}`}
                      >
                        <div className="flex h-32 relative bg-gray-50">
                          {/* Image half */}
                          <div className="w-[45%] h-full">
                            <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                          </div>
                          {/* Info half */}
                          <div className="w-[55%] p-4 flex flex-col justify-center bg-white">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{v.name}</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">{v.category} · {v.model}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md"><Users className="w-3 h-3" /> {v.pax}</span>
                              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md"><Luggage className="w-3 h-3" /> {v.bags}</span>
                            </div>
                          </div>
                          {selected && (
                            <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white mr-6">
                              <Check className="w-4 h-4" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 3 — Extras ══════════ */}
            {step === 3 && (
              <StepPanel stepKey={3}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
                    Trip details
                  </h1>
                  <p className="text-gray-400 text-[13px] mt-1">Customize your ride experience.</p>
                </div>

                <div className="px-5 space-y-4">
                  <div className="bg-gray-50 rounded-2xl px-5">
                    <Counter label="Passengers" value={values.passengers} onChange={v => setValue("passengers", v)} min={1} max={vehicle?.pax || 14} />
                    <Counter label="Luggage" value={values.luggage} onChange={v => setValue("luggage", v)} min={0} max={vehicle?.bags || 10} />
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Add-ons</p>
                    <label className="flex items-center justify-between py-3 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Meet & Greet</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Inside pickup with sign (+$25)</p>
                      </div>
                      <input type="checkbox" {...register("addonMeetGreet")} className="w-5 h-5 accent-black rounded border-gray-300" />
                    </label>
                    <div className="h-px bg-gray-200 my-1" />
                    <label className="flex items-center justify-between py-3 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Child Seat</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Pre-installed safety seat (+$20)</p>
                      </div>
                      <input type="checkbox" {...register("addonChildSeat")} className="w-5 h-5 accent-black rounded border-gray-300" />
                    </label>
                    <div className="h-px bg-gray-200 my-1" />
                    <div className="py-2">
                      <Counter label="Extra Stops" note="+$15 per stop" value={values.extraStops || 0} onChange={v => setValue("extraStops", v)} min={0} max={5} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Flight & Notes</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Airline" {...register("airline")} className="h-12 bg-white border-transparent shadow-sm rounded-xl text-sm" />
                        <Input placeholder="Flight #" {...register("flightNumber")} className="h-12 bg-white border-transparent shadow-sm rounded-xl text-sm" />
                      </div>
                      <Textarea placeholder="Special instructions for the chauffeur..." {...register("specialInstructions")} className="bg-white border-transparent shadow-sm rounded-xl text-sm resize-none h-20" />
                    </div>
                  </div>
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 4 — Passenger ══════════ */}
            {step === 4 && (
              <StepPanel stepKey={4}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
                    Who's riding?
                  </h1>
                </div>

                <div className="px-5 space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                    <div>
                      <Input placeholder="Full Name" {...register("passengerName")} className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm ${errors.passengerName ? "border-red-400" : ""}`} />
                      {errors.passengerName && <p className="text-xs text-red-500 mt-1">{errors.passengerName.message}</p>}
                    </div>
                    <div>
                      <Input type="email" placeholder="Email address" {...register("passengerEmail")} className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm ${errors.passengerEmail ? "border-red-400" : ""}`} />
                      {errors.passengerEmail && <p className="text-xs text-red-500 mt-1">{errors.passengerEmail.message}</p>}
                    </div>
                    <div>
                      <Input type="tel" placeholder="Mobile Number" {...register("passengerPhone")} className={`h-12 bg-white border-transparent shadow-sm rounded-xl text-sm ${errors.passengerPhone ? "border-red-400" : ""}`} />
                      {errors.passengerPhone && <p className="text-xs text-red-500 mt-1">{errors.passengerPhone.message}</p>}
                    </div>
                  </div>
                </div>
              </StepPanel>
            )}

            {/* ══════════ STEP 5 — Payment ══════════ */}
            {step === 5 && (
              <StepPanel stepKey={5}>
                <div className="px-5 pt-8 pb-5">
                  <h1 className="text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
                    Review & Pay
                  </h1>
                </div>

                <div className="px-5">
                  <div className="bg-black text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Fare</p>
                    <p className="text-[42px] font-black tracking-tight leading-none mb-6">
                      {formatUsd(displayTotal)}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between border-b border-gray-800 pb-2">
                        <span>{computedTripType}</span>
                        <span className="font-medium text-white">{vehicle?.name}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Date & Time</span>
                        <span className="font-medium text-white">{values.pickupDate} · {values.pickupTime}</span>
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-4 font-medium">
                      {bookingError}
                    </div>
                  )}
                  {piError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-4 font-medium">
                      {piError}
                    </div>
                  )}

                  {!clientSecret && !piError && !bookingError && (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-3 text-black" />
                      <p className="text-sm">Preparing secure payment...</p>
                    </div>
                  )}

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

      {/* ── Bottom floating bar ── */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-5 py-4 z-40 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-black text-white h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.98] transition-all"
          >
            {step === 1 ? "Choose Vehicle" : step === 4 ? "Review & Pay" : "Continue"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

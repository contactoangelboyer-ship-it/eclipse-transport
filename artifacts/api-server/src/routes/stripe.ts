import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import { calculateBookingPrice, type BookingPriceInput } from "@workspace/booking-pricing";

const router: IRouter = Router();

// Stripe can change the opaque portion of its key format. Validate only the
// stable prefix and let Stripe itself validate the complete key.
const SECRET_KEY_PATTERN = /^(sk|rk)_(test|live)_[^\s]+$/;
const PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9]+$/;

function normalizeEnvValue(value: string | undefined): string {
  if (!value) return "";

  // Vercel values are occasionally pasted with surrounding quotes or a
  // trailing newline. Normalize those without ever logging the secret.
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^(['"])(.*)\1$/s, "$2")
    .replace(/\s+/g, "");
}

function getConfiguredStripeKey(): string | null {
  // STRIPE_SECRET_KEY is the canonical name. The aliases keep existing
  // Vercel projects working while they migrate from older configurations.
  const key = normalizeEnvValue(
    process.env.STRIPE_SECRET_KEY ??
      process.env.STRIPE_SECRET ??
      process.env.STRIPE_API_KEY,
  );
  return SECRET_KEY_PATTERN.test(key) ? key : null;
}

function getConfiguredPublishableKey(): string | null {
  const key = normalizeEnvValue(
    process.env.STRIPE_PUBLISHABLE_KEY ??
      process.env.VITE_STRIPE_PUBLISHABLE_KEY,
  );
  return PUBLISHABLE_KEY_PATTERN.test(key) ? key : null;
}

function getStripeClient(): Stripe {
  const key = getConfiguredStripeKey();
  if (!key) throw new Error("Stripe server configuration is missing or invalid.");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

/**
 * GET /api/stripe/config
 * Returns only the publishable key needed by Stripe.js.
 *
 * The browser must never receive STRIPE_SECRET_KEY. Keeping this lookup on
 * the API also means the same Vercel environment configuration is used by
 * both the web project and the API project.
 */
router.get("/stripe/config", (req, res): void => {
  const publishableKey = getConfiguredPublishableKey();

  if (!publishableKey) {
    req.log.error("Stripe publishable key is missing or has an invalid format");
    res.status(503).json({ error: "Payment service is not configured." });
    return;
  }

  res.json({ publishableKey });
});

/**
 * POST /api/stripe/payment-intent
 * Creates a Stripe PaymentIntent for the given booking amount.
 * Body: {
 *   quote: BookingPriceInput,
 *   amountCents?: integer,
 *   customerEmail?: string,
 *   metadata?: object,
 *   idempotencyKey?: string
 * }
 * Response: { clientSecret: string, amount: number }
 */
router.post("/stripe/payment-intent", async (req, res): Promise<void> => {
  try {
    const {
      quote,
      amount: clientAmount,
      amountCents: clientAmountCents,
      customerEmail,
      metadata = {},
      idempotencyKey,
    } = req.body as {
      quote?: BookingPriceInput;
      amount?: number;
      amountCents?: number;
      customerEmail?: string;
      metadata?: Record<string, string>;
      idempotencyKey?: string;
    };

    if (!quote) {
      res.status(400).json({ error: "A complete booking quote is required." });
      return;
    }

    const breakdown = calculateBookingPrice(quote);
    const amount = breakdown.total;
    if (amount <= 0 || !Number.isFinite(amount)) {
      res.status(400).json({ error: "Complete the trip details and select a vehicle before paying." });
      return;
    }

    const amountCents = Math.round(amount * 100);
    if (
      clientAmount !== undefined &&
      (typeof clientAmount !== "number" || !Number.isFinite(clientAmount) ||
        Math.abs(clientAmount - amount) > 0.01)
    ) {
      res.status(409).json({ error: "The displayed price is out of date. Please review your trip and try again." });
      return;
    }

    if (
      clientAmountCents !== undefined &&
      (!Number.isSafeInteger(clientAmountCents) || clientAmountCents !== amountCents)
    ) {
      res.status(409).json({ error: "The displayed price is out of date. Please review your trip and try again." });
      return;
    }

    if (
      idempotencyKey !== undefined &&
      (typeof idempotencyKey !== "string" ||
        idempotencyKey.length < 8 ||
        idempotencyKey.length > 255)
    ) {
      res.status(400).json({ error: "Invalid payment request. Please try again." });
      return;
    }

    if (!getConfiguredStripeKey()) {
      res.status(503).json({ error: "Stripe server configuration is missing or invalid. Please contact dispatch." });
      return;
    }

    const stripe = getStripeClient();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      receipt_email:
        typeof customerEmail === "string" && customerEmail.trim()
          ? customerEmail.trim()
          : undefined,
      metadata: {
        ...metadata,
        source: "eclipse-transport-booking",
      },
      automatic_payment_methods: { enabled: true },
    }, idempotencyKey ? { idempotencyKey } : undefined);

    if (!paymentIntent.client_secret) {
      res.status(502).json({ error: "Payment service did not return a secure payment session." });
      return;
    }

    res.json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (err) {
    const error = err as Stripe.errors.StripeError;
    req.log.error({ err: error }, "Stripe payment intent creation failed");

    if (error?.type === "StripeAuthenticationError") {
      res.status(503).json({
        error: "Stripe server configuration is invalid. Please contact dispatch.",
      });
      return;
    }

    res.status(502).json({ error: "Unable to initialise payment. Please try again." });
  }
});

/**
 * POST /api/stripe/webhook
 * Stripe sends payment_intent.succeeded events here.
 * If the booking was not saved by the frontend (network loss after payment),
 * we recreate it from the PaymentIntent metadata so no reservation is lost.
 * Requires STRIPE_WEBHOOK_SECRET env; if missing we log and accept the event
 * without signature verification (still creates booking as fallback).
 */
router.post("/stripe/webhook", async (req, res): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      const sig = req.headers["stripe-signature"] as string | undefined;
      if (!sig) { res.status(400).send("Missing stripe-signature"); return; }
      const stripe = getStripeClient();
      const rawBody = (req as unknown as { body: Buffer }).body;
      const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody));
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } else {
      // Fallback: accept JSON-parsed body (Vercel without raw body config)
      const body = req.body as Stripe.Event;
      if (!body || !body.type) { res.status(400).send("Invalid event"); return; }
      event = body;
      req.log.warn("STRIPE_WEBHOOK_SECRET not set — webhook accepted without signature verification");
    }
  } catch (err) {
    req.log.error({ err }, "Stripe webhook signature verification failed");
    res.status(400).send("Webhook signature verification failed");
    return;
  }

  if (event.type !== "payment_intent.succeeded") {
    res.json({ received: true, ignored: event.type });
    return;
  }

  const pi = event.data.object as Stripe.PaymentIntent;
  const md = (pi.metadata ?? {}) as Record<string, string>;

  try {
    // Idempotency: if booking already exists with this PI, do nothing
    const existing = await db.select().from(bookingsTable).where(eq(bookingsTable.stripePaymentIntentId, pi.id)).limit(1);
    if (existing.length > 0) {
      res.json({ received: true, deduped: true });
      return;
    }

    // Try to reconstruct booking from metadata (frontend now sends full payload as JSON in metadata.booking)
    let bookingData: Record<string, string> | null = null;
    if (md.booking) {
      try { bookingData = JSON.parse(md.booking); } catch { /* ignore */ }
    }

    // Fallback to legacy flat metadata
    const get = (k: string) => bookingData?.[k] ?? md[k] ?? "";

    const passengerName = get("passengerName") || get("passenger_name") || "Guest";
    const passengerEmail = get("passengerEmail") || get("passenger_email") || (pi.receipt_email as string) || "unknown@eclipse-transportla.com";
    const passengerPhone = get("passengerPhone") || get("passenger_phone") || "";
    const pickupLocation = get("pickupLocation") || get("pickup_location") || "TBD";
    const dropoffLocation = get("dropoffLocation") || get("dropoff_location") || "TBD";
    const pickupDate = get("pickupDate") || get("pickup_date") || new Date().toISOString().slice(0, 10);
    const pickupTime = get("pickupTime") || get("pickup_time") || "12:00";
    const serviceType = get("serviceType") || get("service_type") || "Airport Transfer";
    const passengers = parseInt(get("passengers") || "1", 10) || 1;
    const luggage = parseInt(get("luggage") || "0", 10) || 0;
    const vehicleType = get("vehicleType") || get("vehicle_type") || "";
    const specialRequests = get("specialRequests") || get("special_requests") || `Auto-created from Stripe PI ${pi.id}`;
    const totalPrice = pi.amount_received ? pi.amount_received / 100 : (parseFloat(get("estimatedPrice") || get("totalPrice") || "0") || null);

    // Minimal validation — if critical fields missing, log and skip creation (admin can recover from Stripe dashboard)
    if (!passengerPhone || !pickupLocation) {
      req.log.warn({ piId: pi.id, metadata: md }, "Webhook booking skipped — insufficient metadata, manual recovery needed");
      res.json({ received: true, skipped: "insufficient_metadata" });
      return;
    }

    const [booking] = await db.insert(bookingsTable).values({
      passengerName: passengerName.trim(),
      passengerEmail: passengerEmail.trim(),
      passengerPhone: passengerPhone.trim(),
      pickupLocation: pickupLocation.trim(),
      dropoffLocation: dropoffLocation.trim(),
      pickupDate,
      pickupTime,
      serviceType,
      passengers: Number.isFinite(passengers) ? passengers : 1,
      luggage: Number.isFinite(luggage) ? luggage : 0,
      vehicleType,
      specialRequests,
      totalPrice,
      stripePaymentIntentId: pi.id,
      status: "pending",
      paymentStatus: "paid",
    }).returning();

    req.log.info({ bookingId: booking.id, piId: pi.id }, "Booking recovered via Stripe webhook");
    res.json({ received: true, bookingId: booking.id });
  } catch (err) {
    req.log.error({ err, piId: pi.id }, "Webhook booking creation failed");
    // Return 200 so Stripe doesn't retry endlessly on non-transient errors
    res.status(200).json({ received: true, error: "creation_failed_but_acked" });
  }
});

export default router;

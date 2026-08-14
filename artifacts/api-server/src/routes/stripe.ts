import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { calculateBookingPrice, type BookingPriceInput } from "@workspace/booking-pricing";

const router: IRouter = Router();

const SECRET_KEY_PATTERN = /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/;
const PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9]+$/;

function normalizeEnvValue(value: string | undefined): string {
  if (!value) return "";

  // Vercel values are occasionally pasted with surrounding quotes or a
  // trailing newline. Normalize those without ever logging the secret.
  return value.trim().replace(/^(['"])|(['"])$/g, "");
}

function getConfiguredStripeKey(): string | null {
  const key = normalizeEnvValue(process.env.STRIPE_SECRET_KEY);
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
 * Body: { quote: BookingPriceInput, customerEmail?: string, metadata?: object }
 * Response: { clientSecret: string, amount: number }
 */
router.post("/stripe/payment-intent", async (req, res): Promise<void> => {
  try {
    const { quote, amount: clientAmount, customerEmail, metadata = {} } = req.body as {
      quote?: BookingPriceInput;
      amount?: number;
      customerEmail?: string;
      metadata?: Record<string, string>;
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

    if (
      clientAmount !== undefined &&
      (typeof clientAmount !== "number" || !Number.isFinite(clientAmount) ||
        Math.abs(clientAmount - amount) > 0.01)
    ) {
      res.status(409).json({ error: "The displayed price is out of date. Please review your trip and try again." });
      return;
    }

    if (!getConfiguredStripeKey()) {
      res.status(503).json({ error: "Stripe server configuration is missing or invalid. Please contact dispatch." });
      return;
    }

    const stripe = getStripeClient();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      receipt_email: customerEmail,
      metadata: {
        ...metadata,
        source: "eclipse-transport-booking",
      },
      automatic_payment_methods: { enabled: true },
    });

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

export default router;

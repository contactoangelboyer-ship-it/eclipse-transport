import { Router, type IRouter } from "express";
import Stripe from "stripe";

const router: IRouter = Router();

const SECRET_KEY_PATTERN = /^sk_(test|live)_[A-Za-z0-9]+$/;
const PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9]+$/;

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("Stripe secret key is not configured");
  if (!SECRET_KEY_PATTERN.test(key)) {
    throw new Error("Stripe secret key has an invalid format");
  }
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

/**
 * GET /api/stripe/config
 * Returns only the publishable Stripe key needed by Stripe.js.
 *
 * The old frontend read VITE_STRIPE_PUBLISHABLE_KEY directly at build time.
 * That allowed a secret `sk_...` value to be accidentally assigned to the
 * browser variable. Keep this value server-side and expose only a validated
 * `pk_...` key.
 */
router.get("/stripe/config", (req, res): void => {
  const publishableKey = (
    process.env.STRIPE_PUBLISHABLE_KEY ??
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ??
    ""
  ).trim();

  if (!PUBLISHABLE_KEY_PATTERN.test(publishableKey)) {
    req.log.error(
      "Stripe publishable key is missing or has an invalid format",
    );
    res.status(503).json({ error: "Payment service is not configured." });
    return;
  }

  res.json({ publishableKey });
});

/**
 * POST /api/stripe/payment-intent
 * Creates a Stripe PaymentIntent for the given booking amount.
 * Body: { amount: number (USD dollars), customerEmail?: string, metadata?: object }
 * Response: { clientSecret: string }
 */
router.post("/stripe/payment-intent", async (req, res): Promise<void> => {
  try {
    const { amount, customerEmail, metadata = {} } = req.body as {
      amount: number;
      customerEmail?: string;
      metadata?: Record<string, string>;
    };

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "Invalid amount. Must be a positive number." });
      return;
    }

    const stripe = getStripeClient();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // dollars → cents
      currency: "usd",
      receipt_email: customerEmail,
      metadata: {
        ...metadata,
        source: "eclipse-transport-booking",
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    req.log.error({ err }, "Stripe payment intent creation failed");
    res.status(502).json({
      error: "Unable to initialize payment. Please try again.",
    });
  }
});

export default router;

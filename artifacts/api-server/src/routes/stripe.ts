import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { calculateBookingPrice, type BookingPriceInput } from "@workspace/booking-pricing";

const router: IRouter = Router();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

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

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      res.status(503).json({ error: "Online payments are temporarily unavailable. Please call dispatch to complete your reservation." });
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
    const error = err as Error;
    res.status(502).json({ error: error.message ?? "Failed to create payment intent" });
  }
});

export default router;

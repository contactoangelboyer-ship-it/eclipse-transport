import { Router, type IRouter } from "express";
import Stripe from "stripe";

const router: IRouter = Router();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

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
    const error = err as Error;
    res.status(500).json({ error: error.message ?? "Failed to create payment intent" });
  }
});

export default router;

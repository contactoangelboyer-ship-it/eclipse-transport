import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, Lock, Shield } from "lucide-react";

/* ─── Load Stripe outside of component to avoid recreation ─── */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

/* ─── Inner form (must be inside <Elements>) ─── */
function CheckoutForm({
  amount,
  onSuccess,
  onError,
}: {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      const msg = confirmError.message ?? "Payment failed. Please try again.";
      setError(msg);
      onError(msg);
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onSuccess(paymentIntent.id);
    } else {
      setError("Unexpected payment status. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={14} className="text-gray-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Secure Payment
          </p>
        </div>
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card", "apple_pay", "google_pay"],
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-[#1A1A1A] text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock size={16} />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-gray-400">
        <Shield size={13} />
        <p className="text-[11px] font-medium">
          Secured by Stripe · 256-bit SSL encryption
        </p>
      </div>
    </form>
  );
}

/* ─── Outer wrapper — provides Elements context ─── */
export function StripeCheckout({
  clientSecret,
  amount,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1A1A1A",
            colorBackground: "#ffffff",
            colorText: "#1A1A1A",
            colorDanger: "#EF4444",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            spacingUnit: "4px",
            borderRadius: "12px",
          },
        },
      }}
    >
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}

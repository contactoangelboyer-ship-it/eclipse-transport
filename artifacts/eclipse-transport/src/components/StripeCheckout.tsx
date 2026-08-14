import { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, Lock, Shield } from "lucide-react";

const PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9]+$/;

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
      setLoading(false);
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
        className="w-full py-4 bg-black text-white font-medium text-[15px] rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock size={15} />
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
  publishableKey,
  amount,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  publishableKey: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const normalizedPublishableKey = publishableKey.trim();
  const isValidPublishableKey = PUBLISHABLE_KEY_PATTERN.test(normalizedPublishableKey);
  const stripePromise = useMemo(
    () => (isValidPublishableKey ? loadStripe(normalizedPublishableKey) : null),
    [isValidPublishableKey, normalizedPublishableKey],
  );

  if (!isValidPublishableKey) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Payment service is not configured correctly. Please try again later.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: "en",
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#000000",
            colorBackground: "#ffffff",
            colorText: "#000000",
            colorDanger: "#EF4444",
            fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif',
            spacingUnit: "4px",
            borderRadius: "8px",
          },
          rules: {
            '.Input': {
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              transition: 'border-color 0.2s ease',
            },
            '.Input:focus': {
              border: '1px solid #000000',
              boxShadow: 'none',
            },
          }
        },
      }}
    >
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}

'use client';

import { useCart } from "react-use-cart";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/success` },
    });

    if (error) setMessage(error.message);
    setLoading(false);
  };

  if (!stripe || !elements) {
    if (!loadError) setLoadError(true);
    return <p className="text-red-600">Payment setup failed. Please refresh the page.</p>;
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-yellow-400 text-blue-950 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition shadow-md"
        >
          {loading ? "Processing…" : "Fullfør betaling"}
        </button>
        {message && <div className="text-red-600 mt-2">{message}</div>}
      </form>
      <button
        onClick={onBack}
        className="mt-6 text-blue-700 underline hover:text-blue-900"
      >
        ← Tilbake til handlekurv
      </button>
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, updateItemQuantity, emptyCart } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [loadingSecret, setLoadingSecret] = useState(false);

  // New state for shipping
  const [shippingOption, setShippingOption] = useState({ id: 'standard', name: 'Standard shipping (2-4 days)', cost: 500 });

  useEffect(() => setIsClient(true), []);

  if (!isClient) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSum = subtotal + shippingOption.cost;

  const handleCheckout = async () => {
    if (!items.length) return;

    setLoadingSecret(true);
    try {
      // Include shipping info in POST body
      const lineItems = items.map(item => ({
        name: item.name,
        price: Math.round(item.price),
        quantity: item.quantity,
      }));

      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lineItems, shipping: shippingOption }),
      });

      const data = await res.json();

      if (data.client_secret) {
        setClientSecret(data.client_secret);
        setShowCheckout(true);
      } else {
        console.error("No client_secret returned:", data);
        alert("Failed to initialize payment. Try again.");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("Failed to initialize payment. Try again.");
    }
    setLoadingSecret(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex justify-center items-center px-6 py-10">
      <AnimatePresence mode="wait">
        {!showCheckout ? (
          <motion.div
            key="cart"
            initial={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Left column – products */}
            <div className="p-8 md:p-10">
              <h1 className="text-3xl font-semibold text-blue-950 mb-8 text-center tracking-wide">
                Handlekurv
              </h1>

              {items.length === 0 ? (
                <p className="text-center text-blue-800">Handlekurven er tom.</p>
              ) : (
                <div className="space-y-8">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-blue-200 pb-5">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.images?.[0] || "/placeholder.png"}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-xl border border-blue-200 shadow-sm"
                        />
                        <div>
                          <p className="font-medium text-blue-950 text-lg">{item.name}</p>
                          {item.artist && (
                            <p className="text-blue-700 text-sm font-light">av {item.artist}</p>
                          )}
                          <p className="text-blue-800 text-sm font-semibold mt-1">
                            ${(item.price / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1 bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 transition">−</button>
                        <span className="font-semibold text-blue-900">{item.quantity}</span>
                        <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 transition">+</button>
                        <button onClick={() => removeItem(item.id)}
                                className="px-4 py-1 text-sm bg-yellow-400 text-blue-950 font-medium rounded-md hover:bg-yellow-300 transition">
                          Fjern
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column – summary */}
            <div className="bg-blue-400 text-blue-50 p-8 md:p-10 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Oppsummering</h2>

                {/* Shipping options */}
                <div className="mb-4">
                  <p className="text-blue-100 mb-2 font-medium">Velg frakt</p>
                  <select
                    value={shippingOption.id}
                    onChange={(e) => {
                      const option = shippingOptions.find(opt => opt.id === e.target.value);
                      setShippingOption(option);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-blue-700 bg-blue-800 text-blue-50"
                  >
                    <option value="standard">Standard shipping (2-4 days) – 50,00 NOK</option>
                    <option value="express">Express shipping (1-2 days) – 100,00 NOK</option>
                  </select>
                </div>

                <div className="flex justify-between text-lg font-medium border-t border-blue-700 pt-4">
                  <span>Subtotal:</span>
                  <span className="text-yellow-400">
                    ${(subtotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-medium mt-2">
                  <span>Frakt:</span>
                  <span className="text-yellow-400">
                    ${(shippingOption.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold mt-2 border-t border-blue-700 pt-2">
                  <span>Total:</span>
                  <span className="text-yellow-400">
                    ${(totalSum / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

              </div>

              <div className="mt-10 space-y-4">
                <button
                  onClick={handleCheckout}
                  disabled={loadingSecret}
                  className="w-full bg-yellow-400 text-blue-950 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition shadow-md"
                >
                  {loadingSecret ? "Preparing…" : "Gå til kassen"}
                </button>
                <button
                  onClick={emptyCart}
                  className="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Tøm handlekurv
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="checkout"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl font-semibold text-blue-950 mb-6">Fullfør betaling</h2>

            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm onBack={() => setShowCheckout(false)} />
              </Elements>
            ) : (
              <p className="text-gray-600">Preparing checkout…</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Shipping options list
const shippingOptions = [
  { id: "standard", name: "Standard shipping (2-4 days)", cost: 500 },
  { id: "express", name: "Express shipping (1-2 days)", cost: 1000 },
];

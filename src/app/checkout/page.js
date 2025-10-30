'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from 'react-use-cart';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Standard shipping (2-4 days)', price: 50 },
  { id: 'express', label: 'Express shipping (1-2 days)', price: 150 },
];

function CheckoutForm({ clientSecret, selectedShipping }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) setMessage(error.message);
    setLoading(false);
  };

  if (!stripe || !elements) {
    return <p className="text-red-600">Payment setup failed. Please refresh the page.</p>;
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          {loading ? 'Processing…' : 'Pay now'}
        </button>
        {message && <div className="text-red-600 mt-2">{message}</div>}
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, isEmpty } = useCart();
  const [clientSecret, setClientSecret] = useState(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_OPTIONS[0]); // default shipping

  // Calculate subtotal of cart in cents
  const subtotalCents = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalCents = subtotalCents + selectedShipping.price * 100; // shipping in cents

  // Fetch client_secret from API whenever cart or shipping changes
  useEffect(() => {
    if (isEmpty) return;

    const fetchClientSecret = async () => {
      setLoadingSecret(true);
      try {
        // Convert cart items to Stripe format (price in cents)
        const lineItems = items.map(item => ({
          price: Math.round(item.price),
          quantity: item.quantity,
          name: item.name,
        }));

        const res = await fetch('/api/checkout_sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineItems, shippingAmount: selectedShipping.price * 100 }),
        });

        const data = await res.json();

        if (data.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          console.error('No client_secret returned:', data);
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
      } finally {
        setLoadingSecret(false);
      }
    };

    fetchClientSecret();
  }, [items, selectedShipping, isEmpty]);

  if (isEmpty) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Your cart is empty.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      {/* Cart summary */}
      <div className="w-full max-w-md mb-6 bg-white rounded-xl shadow p-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">x{item.quantity}</p>
            </div>
            <p>${(item.price / 100).toFixed(2)}</p>
          </div>
        ))}
        <hr className="my-4" />
        <p className="text-lg font-semibold">Subtotal: ${(subtotalCents / 100).toFixed(2)}</p>

        {/* Shipping selector */}
        <div className="mt-4">
          <label className="block mb-2 font-medium">Shipping method</label>
          <select
            value={selectedShipping.id}
            onChange={(e) =>
              setSelectedShipping(
                SHIPPING_OPTIONS.find(option => option.id === e.target.value)
              )
            }
            className="w-full p-2 border rounded-lg"
          >
            {SHIPPING_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>
                {option.label} (+{(option.price).toFixed(0)} NOK)
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-lg font-semibold">
          Total: ${(totalCents / 100).toFixed(2)}
        </p>
      </div>

      {loadingSecret && <p className="text-gray-600 mb-4">Preparing checkout…</p>}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm selectedShipping={selectedShipping} />
        </Elements>
      )}
    </main>
  );
}

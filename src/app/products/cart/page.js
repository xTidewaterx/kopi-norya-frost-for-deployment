'use client';

import { useCart } from "react-use-cart";
import { useState, useEffect } from "react";

const CartPage = () => {
  const { items, removeItem, updateItemQuantity, emptyCart } = useCart();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const filteredMappedItems = items.reduce((filteredItems, { default_price_id, quantity }) => {
    filteredItems.push({ default_price_id, quantity });
    return filteredItems;
  }, []);

  const createCheckoutSession = async () => {
    const response = await fetch("https://localhost:3000/api/checkout_sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filteredMappedItems),
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const totalSum = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex justify-center items-center px-6 py-10">
      <div className="grid md:grid-cols-2 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
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
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-blue-200 pb-5"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.images?.[0] || "/placeholder.png"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-xl border border-blue-200 shadow-sm"
                    />
                    <div>
                      <p className="font-medium text-blue-950 text-lg">{item.name}</p>
                      {item.artist && (
                        <p className="text-blue-700 text-sm font-light">
                          av {item.artist}
                        </p>
                      )}
                      <p className="text-blue-800 text-sm font-semibold mt-1">
                        ${(item.price / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {item.currency?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 transition"
                    >
                      −
                    </button>
                    <span className="font-semibold text-blue-900">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 transition"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="px-4 py-1 text-sm bg-yellow-400 text-blue-950 font-medium rounded-md hover:bg-yellow-300 transition"
                    >
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
            <p className="text-blue-100 mb-6">
              Frakt og avgifter beregnes ved utsjekk.
            </p>

            <div className="flex justify-between text-lg font-medium border-t border-blue-700 pt-4">
              <span>Totalt:</span>
              <span className="text-yellow-400">
                ${(totalSum / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                USD
              </span>
            </div>

            <div className="mt-8">
              <label className="block text-sm text-blue-200 mb-2">Notat til oss</label>
              <input
                type="text"
                placeholder="Skriv en melding til vårt team..."
                className="w-full px-4 py-2 rounded-lg border border-blue-700 bg-blue-800 text-blue-50 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" className="accent-yellow-400" />
              <p className="text-sm ">
                Jeg godtar{" "}
                <span className="text-yellow-400 cursor-pointer hover:underline">
                  vilkårene
                </span>
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <button
              onClick={() => createCheckoutSession()}
              className="w-full bg-yellow-400 text-blue-950 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition shadow-md"
            >
              Gå til kassen
            </button>
            <button
              onClick={emptyCart}
              className="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Tøm handlekurv
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const items = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate items and calculate total in cents
    const totalAmount = items.reduce((sum, item) => {
      if (!item.price || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid item data");
      }
      return sum + Math.round(item.price) * item.quantity;
    }, 0);

    if (totalAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Total amount must be greater than zero" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "nok",
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({ client_secret: paymentIntent.client_secret }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Stripe PaymentIntent error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create payment intent" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

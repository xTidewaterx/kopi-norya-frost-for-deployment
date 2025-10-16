import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ===========================
   GET PRODUCTS OR SINGLE PRODUCT
=========================== */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // If product ID is provided, return that single product
    if (id) {
      const product = await stripe.products.retrieve(id);
      const price = await stripe.prices.retrieve(product.default_price);

      return NextResponse.json({
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        price: price.unit_amount / 100,
        currency: price.currency,
        metadata: product.metadata,
      });
    }

    console.log("Fetching all Stripe products...");
    const products = await stripe.products.list({ limit: 6 });

    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        let price = null;
        if (product.default_price) {
          const priceData = await stripe.prices.retrieve(product.default_price);
          price = priceData.unit_amount / 100;
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          price,
          currency: product.default_price ? "usd" : null,
          metadata: product.metadata,
        };
      })
    );

    return NextResponse.json({ data: productsWithPrices });
  } catch (error) {
    console.error("Stripe API error (GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ===========================
   CREATE NEW PRODUCT
=========================== */
export async function POST(req) {
  try {
    const { name, description, price, images, metadata } = await req.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: "Product name and price are required" },
        { status: 400 }
      );
    }

    console.log("Creating new Stripe product:", { name, description, price, images, metadata });

    // Step 1: Create Product in Stripe
    const product = await stripe.products.create({
      name,
      description: description || "",
      images: images || [],
      metadata: metadata || {}, // optional creator data
    });

    // Step 2: Create Price for Product
    const priceData = await stripe.prices.create({
      unit_amount: Math.round(Number(price)),
      currency: "usd",
      product: product.id,
    });

    // Step 3: Update Product to set Default Price
    const updatedProduct = await stripe.products.update(product.id, {
      default_price: priceData.id,
    });

    console.log("✅ Product created successfully:", updatedProduct.id);

    return NextResponse.json({ product: updatedProduct, price: priceData });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ===========================
   PATCH (UPDATE IMAGES OR PRICE)
=========================== */
export async function PATCH(req) {
  try {
    const { id, images, price, metadata } = await req.json();
    console.log("PATCH request received:", { id, images, price, metadata });

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const updatedFields = {};

    if (images) updatedFields.images = images;
    if (metadata) updatedFields.metadata = metadata;

    // Optional: Update Price if provided
    let newPriceData = null;
    if (price) {
      const parsedPrice = Math.round(Number(price));
      if (isNaN(parsedPrice)) {
        return NextResponse.json(
          { error: "Invalid price format" },
          { status: 400 }
        );
      }

      newPriceData = await stripe.prices.create({
        unit_amount: parsedPrice,
        currency: "usd",
        product: id,
      });

      updatedFields.default_price = newPriceData.id;
    }

    // Update Product
    const updatedProduct = await stripe.products.update(id, updatedFields);
    console.log("✅ Product updated:", updatedProduct.id);

    return NextResponse.json({ updatedProduct, newPrice: newPriceData });
  } catch (error) {
    console.error("❌ Error in PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

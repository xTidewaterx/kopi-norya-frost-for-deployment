import { notFound, redirect } from "next/navigation";
import Stripe from "stripe";
import Link from "next/link";

import CartWrapper from "../../../app/utils/cartWrapper";
import CartButton from "../../../app/utils/cartButton";
import PostProduct from "../../post/PostProduct";

import ImageCarousel from "../../components/productDetailPage/ImageCarousel";
import GetProducts from "../../components/productDetailPage/get/GetProducts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getProduct(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function getProductPrice(productId) {
  const product = await stripe.products.retrieve(productId);
  const price = await stripe.prices.retrieve(product.default_price);
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    price_amount: price.unit_amount,
    currency: price.currency,
    default_price_id: product.default_price,
  };
}

export default async function ProductDetail({ params, searchParams }) {
  const { id } = params;
  const product = await getProduct(id);
  if (!product) notFound();

  const stripeProduct = await getProductPrice(product.id);


  console.log("Fetched product details:", { product, stripeProduct });
  const completeProduct = {
    id: product.id,
    name: stripeProduct.name,
    description: stripeProduct.description,
    images: stripeProduct.images,
    price: stripeProduct.price_amount,
    currency: stripeProduct.currency,
    default_price_id: stripeProduct.default_price_id,
    artist: product.name || "Unknown Artist",
  };

  const isEditing = searchParams?.edit === "true";
  if (searchParams?.saved === "true") redirect(`/products/${id}?edit=false`);

  return (
    <CartWrapper>
      <div className="bg-neutral-50 px-4 py-16 flex justify-center">
        <div className="max-w-screen-lg w-full grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
          {isEditing ? (
            <PostProduct currentProduct={completeProduct} />
          ) : (
            <>
              {/* Left: Image Carousel */}
              <div className="flex justify-center items-center">
                <ImageCarousel images={completeProduct.images} />
              </div>

              {/* Right: Product Info */}
              <div className="flex flex-col justify-between space-y-8">
                <div>
                  <p className="text-xs text-neutral-500 tracking-wide uppercase mb-2">
                    {completeProduct.artist}
                  </p>

                  <h1 className="text-4xl font-light text-neutral-900 leading-tight mb-4">
                    {completeProduct.name}
                  </h1>

                  <p className="text-2xl font-medium text-neutral-800 mb-6">
                    {(completeProduct.price / 100).toFixed(2)}{" "}
                    {completeProduct.currency.toUpperCase()}
                  </p>

                  {completeProduct.description && (
                    <p className="text-neutral-600 text-base leading-relaxed whitespace-pre-wrap">
                      {completeProduct.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <CartButton product={completeProduct} />

                  <Link
                    href={`?edit=true`}
                    className="block text-center w-full px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-all duration-200"
                  >
                    Edit Product
                  </Link>

                  <div className="flex justify-between text-sm text-neutral-500 pt-2">
                    <Link
                      href={`/products/${parseInt(id) + 1}`}
                      className="hover:text-neutral-800 transition"
                    >
                      → Next Product
                    </Link>
                    <Link
                      href="/products/cart"
                      className="hover:text-neutral-800 transition"
                    >
                      🛒 Go to Cart
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <GetProducts />
    </CartWrapper>
  );
}

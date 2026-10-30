"use client";
import { Localized } from "@/components/Localization";


import { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

export function AddToCartActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return <Localized><div className="product-cart-actions" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={handleAdd}
          className="btn btn-teal btn-lg"
          style={{ flex: 1, justifyContent: "center" }}
        >
          {added ? "✓ Added to Cart!" : "🛒 Add to Cart"}
        </button>

        <Link
          href="/cart"
          className="btn btn-outline btn-lg"
          style={{ justifyContent: "center" }}
        >
          View Cart →
        </Link>
      </div>

      <Link
        href={`/checkout?product=${product.slug}`}
        className="btn btn-dark btn-lg"
        style={{ width: "100%", justifyContent: "center" }}
      >
        Buy Now / Reserve Unit →
      </Link>

      <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", textAlign: "center" }}>
        🔒 Unit locked for 12 minutes during checkout · 100% secure payment
      </p>
    </div></Localized>;
}



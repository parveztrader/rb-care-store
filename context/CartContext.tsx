"use client";
import { Localized } from "@/components/Localization";


import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { type Product, formatINR } from "@/lib/catalog";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDeliveryTotal: number;
  cartGrandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "rb_care_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<{ product: Product; quantity: number } | null>(null);

  // Auto hide toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage on updates
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart, isLoaded]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, quantity }];
      }
    });

    // Trigger popup toast notification
    setToast({ product, quantity });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const cartDeliveryTotal = cart.reduce((total, item) => total + item.product.delivery * item.quantity, 0);
  const cartGrandTotal = cartSubtotal + cartDeliveryTotal;

  return <Localized><CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDeliveryTotal,
        cartGrandTotal,
      }}
    >
      {children}

      {/* Cart Popup Toast Notification */}
      {toast && (
        <div className="cart-toast-popup" role="alert" aria-live="polite">
          <div className="cart-toast-img">
            <img
              src={toast.product.image}
              alt={toast.product.name}
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=900&q=80";
              }}
            />
          </div>
          <div className="cart-toast-body">
            <div className="cart-toast-header">
              <span className="cart-toast-badge">✓ Added to Cart</span>
              <button
                className="cart-toast-close"
                onClick={() => setToast(null)}
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
            <div className="cart-toast-title">{toast.product.name}</div>
            <div className="cart-toast-meta">
              {formatINR(toast.product.price)} · Qty: {toast.quantity}
            </div>
            <div className="cart-toast-actions">
              <Link
                href="/cart"
                className="cart-toast-btn-cart"
                onClick={() => setToast(null)}
              >
                View Cart ({cartCount}) →
              </Link>
              <Link
                href={`/checkout?product=${toast.product.slug}`}
                className="cart-toast-btn-buy"
                onClick={() => setToast(null)}
              >
                Checkout ⚡
              </Link>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider></Localized>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

"use client";
import { Localized } from "@/components/Localization";

import Link from "next/link";
import { useState } from "react";
import { Product, formatINR } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
export function ProductCard({product}:{product:Product}) {
 const {addToCart}=useCart(); const [added,setAdded]=useState(false); const [failed,setFailed]=useState(false);
 return <Localized><article className="lg-card"><Link className="lg-card-header" href={`/products/${product.slug}`}>{failed ? <span className="image-unavailable">{product.category}<small>Photo unavailable</small></span> : <img src={product.image} alt={product.name} onError={()=>setFailed(true)}/>}<span className="lg-badge-tag">2nd hand · Refurbished</span><small className="card-photo-source">{product.photoSource === "ACTUAL" ? "Photos of this unit" : "Reference image"}</small></Link><div className="lg-card-body"><p className="lg-card-cat">{product.brand} · {product.city}</p><Link href={`/products/${product.slug}`}><h3 className="lg-card-title">{product.name}</h3></Link><p className="card-model"><span translate="no">{product.model}</span>{product.capacity ? ` · ${product.capacity}` : ""}</p><p className="card-condition">Condition: {product.condition}<br/>{product.warrantyDays}-day functional warranty</p><div className="lg-card-price-box"><strong className="lg-price-now">{formatINR(product.price)}</strong><p className="delivery-note">Delivery: {formatINR(product.delivery)}</p><div className="lg-card-actions"><button className="lg-btn-add" onClick={()=>{addToCart(product);setAdded(true);}} aria-label={`Add ${product.name} to cart`}>{added ? "Added to cart" : "Add to cart"}</button><Link className="lg-btn-buy" href={`/products/${product.slug}`}>View details</Link></div><span className="sr-only" role="status">{added ? `${product.name} added to cart` : ""}</span></div></div></article></Localized>;
}




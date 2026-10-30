"use client";
import { useEffect, useRef, useState } from "react";
import type { ProductPhoto } from "@/lib/catalog";
import { Localized } from "./Localization";
const requestedViews = ["Rear view", "Inside view", "Model label", "Controls", "Wear and scratches"];
export function ProductGallery({ photos, productName, actual }: { photos: ProductPhoto[]; productName: string; actual: boolean }) {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const slots: { label: string; url?: string }[] = [...photos];
  for (const label of requestedViews) if (slots.length < 6 && !slots.some(slot => slot.label.toLowerCase() === label.toLowerCase())) slots.push({ label });
  const photo = slots[selected] || slots[0];
  useEffect(() => { if (zoomed) dialog.current?.showModal(); else dialog.current?.close(); }, [zoomed]);
  const available = !!photo?.url && !failed[photo.url];
  const availableCount = photos.filter(item => !failed[item.url]).length;
  return <Localized><section className="product-gallery" aria-label="Product image gallery">
    <div className="gallery-main"><span className="gallery-source">{actual ? "Photos of this unit" : "Reference images"}</span>
      {available ? <button type="button" className="gallery-open" onClick={() => setZoomed(true)} aria-label="Enlarge product image"><img src={photo.url} alt={`${productName} — ${photo.label}`} onError={() => photo.url && setFailed(current => ({ ...current, [photo.url!]: true }))}/><span>Click to enlarge</span></button> : <div className="gallery-missing"><strong>{photo?.label}</strong><p>{photo?.url ? "Image unavailable" : "Photo not added"}</p><span>Ask RB Care for a current photo of this view.</span></div>}
    </div>
    <div className="gallery-thumbnails" role="group" aria-label="Choose product view">{slots.map((slot, index) => <button key={`${slot.label}-${index}`} type="button" aria-pressed={selected === index} aria-label={slot.label} onClick={() => setSelected(index)}>{slot.url && !failed[slot.url] ? <img src={slot.url} alt="" loading="lazy" onError={() => setFailed(current => ({ ...current, [slot.url!]: true }))}/> : <span className="gallery-slot-number">{String(index + 1).padStart(2, "0")}</span>}<span>{slot.label}</span>{!slot.url && <small>Not added</small>}</button>)}</div>
    <p className="gallery-caption">{availableCount} {availableCount === 1 ? "image available" : "images available"}. {actual ? "Review every angle and any visible wear before buying." : "Reference images do not confirm this unit's appearance. Request actual unit photos before buying."}</p>
    <dialog ref={dialog} className="gallery-dialog" onCancel={() => setZoomed(false)} onClose={() => setZoomed(false)} onClick={event => { if (event.target === dialog.current) setZoomed(false); }}><div className="gallery-dialog-content"><button className="gallery-close" type="button" onClick={() => setZoomed(false)} aria-label="Close image viewer">×</button><p>{photo?.label} · {actual ? "Photos of this unit" : "Reference images"}</p>{available && <img src={photo.url} alt={`${productName} — ${photo.label}`}/>}</div></dialog>
  </section></Localized>;
}

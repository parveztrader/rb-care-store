"use client";
import { Localized } from "@/components/Localization";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sellCategories, sellConditions } from "@/lib/sell-schema";
const initial = { category: "Washing Machine", brand: "", model: "", capacity: "", age: "", condition: "", description: "", repairs: "", name: "", phone: "", city: "Lucknow", area: "", pincode: "" };
export function SellForm() {
  const [values, setValues] = useState(initial);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [contactConsent, setContactConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLFormElement>(null);
  const photoPicker = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { const urls = photos.map(file => URL.createObjectURL(file)); setPreviews(urls); return () => urls.forEach(URL.revokeObjectURL); }, [photos]);
  useEffect(() => { if (step > 0) heading.current?.focus(); }, [step]);
  const field = (key: keyof typeof initial) => ({ name: key, value: values[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues(v => ({ ...v, [key]: e.target.value })) });
  const labels = ["Appliance", "Condition & photos", "Contact & review"];
  function next() {
    if (!panel.current?.reportValidity()) return;
    if (step === 1 && !photos.length) { setError("Please upload at least one photo."); return; }
    setError(""); setStep(s => s + 1);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 2) { next(); return; }
    setError(""); setBusy(true);
    try {
      const body = new FormData();
      Object.entries(values).forEach(([key, value]) => body.append(key, value));
      body.append("publishConsent", String(contactConsent)); body.append("contactConsent", String(contactConsent));
      photos.forEach(photo => body.append("photos", photo));
      const response = await fetch("/api/sell", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your request could not be submitted.");
      setReceipt(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Check your connection and try again."); }
    finally { setBusy(false); }
  }
  if (receipt) {
    const link = `/sell/track#${receipt.id}:${receipt.token}`;
    return <Localized><section className="sell-form sell-success" role="status"><p className="banner-kicker">REQUEST RECEIVED</p><h2>We have received your appliance details.</h2><p>Your listing is pending team review and is not public. RB Care will review the photos and condition, then show its price on your private tracking page.</p><p><strong>Request ID</strong><br/><code>{receipt.id}</code></p><Link className="btn btn-teal" href={link}>View your request and team price</Link><button className="btn btn-outline" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}${link}`); setCopied(true); } catch { setError("Could not copy the link. Open the tracking page and save its URL."); } }}>{copied ? "Tracking link copied" : "Copy private tracking link"}</button><p className="field-help">Save this private link to check your team's price. Do not share it publicly. No automatic SMS or WhatsApp message has been sent.</p>{error && <p role="alert">{error}</p>}<Link href="/community">Browse customer appliances ›</Link></section></Localized>;
  }
  return <Localized><form className="sell-form" id="sell-form" ref={panel} onSubmit={submit} aria-label="Sell your appliance" aria-busy={busy}>
    <ol className="sell-progress" aria-label="Form progress">{labels.map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined} className={i <= step ? "current" : ""}><span>{i + 1}</span>{label}</li>)}</ol>
    <p className="field-help">Step {step + 1} / 3 · Fields marked * are required</p>
    <h2 tabIndex={-1} ref={heading}>{["Which appliance would you like to sell?", "Describe your appliance's condition", "How can we contact you?"][step]}</h2>
    {step === 0 && <div className="sell-fields">
      <label>Appliance type *<select {...field("category")} required>{sellCategories.map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Brand *<input {...field("brand")} placeholder="For example: LG, Samsung, Whirlpool" minLength={2} maxLength={60} required/></label>
      <label>Model or product name *<input {...field("model")} placeholder="Not sure of the model? Enter its name or type" minLength={2} maxLength={100} required/></label>
      <label>Capacity / Size *<input {...field("capacity")} placeholder="For example: 7 kg, 190 litres, 1.5 ton" maxLength={60} required/></label>
      <label>How old is the appliance? *<select {...field("age")} required><option value="">Select age</option>{["Less than 1 year", "1–3 years", "3–5 years", "5–8 years", "More than 8 years", "Not sure"].map((a, i) => <option key={a} value={a}>{["Less than 1 year", "1–3 years", "3–5 years", "5–8 years", "More than 8 years", "Not sure"][i]}</option>)}</select></label>
      <p className="field-help">The RB Care team will set the price after review. Your listing stays pending and private until then.</p>
    </div>}
    {step === 1 && <div className="sell-fields">
      <fieldset className="wide condition-options"><legend>Is the appliance working? *</legend>{sellConditions.map((condition, i) => <label key={condition}><input type="radio" name="condition" value={condition} checked={values.condition === condition} onChange={() => setValues(v => ({ ...v, condition }))} required/>{["Yes, it works well", "It works, but has issues", "It is not working"][i]}</label>)}</fieldset>
      <label className="wide">Describe the condition and any issues *<textarea {...field("description")} rows={4} minLength={15} maxLength={2000} placeholder="Describe cooling, noise, leaks, scratches or dents. Do not put phone numbers or addresses in the listing description." required/></label>
      <label className="wide">Any previous repairs or replaced parts?<textarea {...field("repairs")} rows={2} maxLength={1000} placeholder="Share what you know, or enter 'Not sure'."/></label>
      <div className="wide photo-upload"><label htmlFor="appliance-photos">Upload photos *<span>1–6 photos · JPG, PNG or WebP · Up to 3 MB each</span></label><button className="btn btn-outline photo-picker-button" type="button" onClick={() => photoPicker.current?.click()}>Choose photos</button><input ref={photoPicker} hidden id="appliance-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => {
        const selected = Array.from(e.target.files || []);
        e.target.value = "";
        if (photos.length + selected.length > 6) { setError("You can upload up to six photos."); return; }
        if (selected.some(f => !["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 3 * 1024 * 1024 || !f.size)) { setError("Choose JPG, PNG or WebP photos, up to 3 MB each."); return; }
        setError(""); setPhotos(p => [...p, ...selected]);
      }}/><p className="field-help">Include clear photos of the front, inside, model label and any damage. Keep names, phone numbers and addresses out of photos.</p><div className="photo-previews">{photos.map((photo, i) => <div key={`${photo.name}-${i}`}><img src={previews[i]} alt={`Appliance photo ${i + 1}`}/><button type="button" onClick={() => setPhotos(p => p.filter((_, index) => index !== i))} aria-label={`Remove photo ${i + 1}`}>Remove ×</button></div>)}</div></div>
    </div>}
    {step === 2 && <><div className="sell-review"><strong>{values.brand} {values.model} · {values.capacity}</strong><p>{values.category} · {values.age} · {photos.length} photos</p><p>{values.description}</p><button type="button" onClick={() => setStep(0)}>Edit appliance details</button></div><div className="sell-fields">
      <label>Your name *<input {...field("name")} autoComplete="name" minLength={2} maxLength={80} required/></label><label>Mobile number *<input {...field("phone")} type="tel" autoComplete="tel-national" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit number" required/></label>
      <label>City or town *<input {...field("city")} autoComplete="address-level2" list="sell-towns" minLength={2} maxLength={80} required/><datalist id="sell-towns"><option>Lucknow</option><option>Gonda</option><option>Bahraich</option><option>Balrampur</option><option>Ayodhya</option><option>Barabanki</option></datalist></label>
      <label>Area or neighbourhood *<input {...field("area")} minLength={2} maxLength={120} placeholder="A full street address is not needed yet" required/></label><label>PIN code *<input {...field("pincode")} autoComplete="postal-code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required/></label>
    </div><div className="sell-consents"><label><input type="checkbox" checked={contactConsent} onChange={e => setContactConsent(e.target.checked)} required/>I own this appliance or have permission to sell it. RB Care may contact me about this request and publish the appliance details and photos at the team's approved price after review. *</label></div><p className="field-help">Your name, phone, area and PIN code are private to RB Care. Only our team can set the price or publish your listing. Pickup arrangements are confirmed separately.</p></>}
    {error && <p className="sell-error" role="alert">{error}</p>}
    <div className="sell-form-actions">{step > 0 && <button className="btn btn-outline" type="button" disabled={busy} onClick={() => { setError(""); setStep(s => s - 1); }}>← Back</button>}<button className="btn btn-teal" type="submit" disabled={busy}>{busy ? "Uploading photos…" : step === 2 ? "Submit for team review" : "Continue →"}</button></div>
  </form></Localized>;
}

import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/Localization";

export const metadata: Metadata = {
  title: "2nd Hand Washing Machine & Fridge | Lucknow, Gonda | RB Care",
  description: "Shop second-hand washing machines, fridges, ACs and microwaves in Lucknow, Gonda and nearby towns. Check condition, prices and warranty, or sell your appliance.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = (await cookies()).get("rb_language")?.value === "hi" ? "hi" : "en";
  return <html lang={language}><body><LanguageProvider initialLanguage={language}>{children}</LanguageProvider></body></html>;
}



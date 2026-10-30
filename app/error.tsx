"use client";
import Link from "next/link";
import { Localized, LanguageToggle } from "@/components/Localization";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Localized><main className="shell section"><LanguageToggle/><h1>Something went wrong</h1><p>Please try again or contact RB Care for help.</p><div className="sell-form-actions"><button className="btn btn-teal" onClick={reset}>Try again</button><Link className="btn btn-outline" href="/">Home</Link></div></main></Localized>;
}

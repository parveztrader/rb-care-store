import type { Metadata } from "next";
export const metadata: Metadata = { title: "Admin Dashboard | RB Care", robots: { index: false, follow: false } };

import { Localized } from "@/components/Localization";
import { LanguageToggle } from "@/components/Localization";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Localized><><div className="admin-language-bar"><LanguageToggle compact/></div>{children}</></Localized>;
}

import Link from "next/link";
import { SiteChrome } from "@/components/SiteChrome";
import { Localized } from "@/components/Localization";
export default function NotFound() {
  return <Localized><SiteChrome><main className="shell section empty-state"><h1>Page not found</h1><p>This page or appliance listing is no longer available.</p><Link className="btn btn-teal" href="/products">Browse available stock</Link></main></SiteChrome></Localized>;
}

import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { getProducts } from "@/lib/inventory";
const url=process.env.NEXT_PUBLIC_SITE_URL||"https://store.rbcareservice.in";
export default function sitemap():MetadataRoute.Sitemap{return [{url,lastModified:new Date()},{url:`${url}/sell`,lastModified:new Date()},{url:`${url}/community`,lastModified:new Date()},...getProducts().map(p=>({url:`${url}/products/${p.slug}`,lastModified:new Date()}))];}


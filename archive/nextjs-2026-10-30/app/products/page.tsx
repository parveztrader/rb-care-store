
import { Localized } from "@/components/Localization";
import Link from "next/link";
import {cities} from "@/lib/catalog";
import {getProducts} from "@/lib/inventory";
import {SiteChrome} from "@/components/SiteChrome";
import {ProductCard} from "@/components/ProductCard";
export default async function ProductsPage({searchParams}:{searchParams:Promise<{city?:string;category?:string;q?:string}>}) {
 const filters=await searchParams;
 const list=getProducts().filter(p=>p.status==='AVAILABLE'&&(!filters.city||p.city===filters.city)&&(!filters.category||p.category===filters.category)&&(!filters.q||`${p.name} ${p.brand} ${p.model} ${p.category}`.toLowerCase().includes(filters.q.toLowerCase())));
 return <Localized><SiteChrome><main className="shell section"><p className="breadcrumb"><Link href="/">Home</Link> / Products</p><h1 className="catalog-title">2nd hand / Used appliances</h1><form action="/products" className="catalog-filters"><label>Category<select name="category" defaultValue={filters.category||''}><option value="">All categories</option>{['Washing Machine','Refrigerator','Air Conditioner','Microwave'].map(c=><option key={c}>{c}</option>)}</select></label><label>City<select name="city" defaultValue={filters.city||''}><option value="">All cities</option>{cities.map(c=><option key={c}>{c}</option>)}</select></label><label>Search<input name="q" defaultValue={filters.q||''} placeholder="Brand, appliance or model"/></label><button className="btn btn-teal" type="submit">Apply filters</button><Link href="/products">Clear filters</Link></form><p className="catalog-count">{list.length} {list.length===1?'product':'products'} found{filters.q?` for “${filters.q}”`:''}</p>{list.length ? <div className="lg-card-grid">{list.map(p=><ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-state"><h2>No matching appliances</h2><p>Try another search, category or city.</p><Link href="/products" className="btn btn-outline">View all products</Link></div>}</main></SiteChrome></Localized>;
}



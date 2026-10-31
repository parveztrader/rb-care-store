export type City = "Lucknow" | "Mumbai" | "Pune" | "Gonda";
export type ProductCategory = "Refrigerator" | "Washing Machine" | "Air Conditioner" | "Microwave";
export type ProductPhoto = { url: string; label: string };
export type ProductSpecification = { label: string; value: string };
export type Product = { slug:string; id:string; name:string; category:ProductCategory; city:City; stockMode:"CITY"|"CENTRAL"; condition:"Excellent"|"Very Good"; price:number; delivery:number; brand:string; model:string; age:string; warrantyDays:number; defects:string; tested:string[]; image:string; status:"AVAILABLE"|"RESERVED"|"SOLD";
  photos?: ProductPhoto[]; photoSource?: "ACTUAL" | "REFERENCE"; description?: string;
  highlights?: string[]; specifications?: ProductSpecification[]; capacity?: string; color?: string;
  included?: string[]; packaging?: string; repairHistory?: string; installation?: string;
};

export const cities: City[] = ["Lucknow", "Mumbai", "Pune", "Gonda"];
let productStore: Product[] = [
 { id:"RBR-LKO-001",slug:"lg-7kg-front-load-washing-machine",name:"LG 7 kg Front Load Washing Machine",capacity:"7 kg",category:"Washing Machine",city:"Lucknow",stockMode:"CITY",condition:"Excellent",price:14500,delivery:650,brand:"LG",model:"FHM1207BDL",age:"Approx. 3 years",warrantyDays:90,defects:"Minor cosmetic marks on side panel.",tested:["Spin cycle","Drainage","Heater","Door lock"],image:"https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=900&q=80",status:"AVAILABLE"},
 { id:"RBR-MUM-004",slug:"whirlpool-265l-double-door-refrigerator",name:"Whirlpool 265 L Double Door Refrigerator",capacity:"265 L",category:"Refrigerator",city:"Mumbai",stockMode:"CITY",condition:"Very Good",price:18500,delivery:900,brand:"Whirlpool",model:"IF PRO INV 278",age:"Approx. 4 years",warrantyDays:90,defects:"Small scratch near lower handle.",tested:["Cooling","Compressor","Door seal","Defrost"],image:"https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=80",status:"AVAILABLE"},
 { id:"RBR-PUN-002",slug:"voltas-1-5-ton-inverter-split-ac",name:"Voltas 1.5 Ton Inverter Split AC",capacity:"1.5 ton",category:"Air Conditioner",city:"Pune",stockMode:"CITY",condition:"Excellent",price:23500,delivery:1200,brand:"Voltas",model:"185V Vectra Elite",age:"Approx. 2 years",warrantyDays:90,defects:"No known functional defects.",tested:["Cooling","Remote","PCB","Leak test"],image:"https://images.unsplash.com/photo-1627335005633-0d5f7f0ee5e6?auto=format&fit=crop&w=900&q=80",status:"AVAILABLE"},
 { id:"RBR-CEN-007",slug:"samsung-28l-convection-microwave",name:"Samsung 28 L Convection Microwave",capacity:"28 L",category:"Microwave",city:"Gonda",stockMode:"CENTRAL",condition:"Very Good",price:6900,delivery:750,brand:"Samsung",model:"CE1041DSB2",age:"Approx. 3 years",warrantyDays:90,defects:"Light surface wear on top.",tested:["Heating","Convection","Turntable","Control panel"],image:"https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=900&q=80",status:"AVAILABLE"}
];

export const products = productStore;

export function getProducts() {
  return productStore;
}

export function addProduct(newProd: Omit<Product, "id" | "slug"> & { id?: string; slug?: string }) {
  const cityCode = newProd.city.slice(0, 3).toUpperCase();
  const randomNum = Math.floor(100 + Math.random() * 900);
  const id = newProd.id || `RBR-${cityCode}-${randomNum}`;
  const slug = newProd.slug || `${newProd.brand}-${newProd.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-${randomNum}`;
  
  const product: Product = {
    ...newProd,
    id,
    slug,
  };
  productStore.unshift(product);
  return product;
}

export function updateProduct(id: string, updates: Partial<Product>) {
  const index = productStore.findIndex(p => p.id === id);
  if (index === -1) throw new Error("Product not found");
  productStore[index] = { ...productStore[index], ...updates };
  return productStore[index];
}

export function deleteProduct(id: string) {
  const index = productStore.findIndex(p => p.id === id);
  if (index !== -1) {
    productStore.splice(index, 1);
  }
}

export const formatINR=(amount:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(amount);


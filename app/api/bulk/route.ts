import { NextResponse } from "next/server";
import { bulkSchema } from "@/lib/validation";
export async function POST(request:Request){try{const enquiry=bulkSchema.parse(await request.json()); console.info("Bulk enquiry",enquiry); return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"Invalid enquiry"},{status:400});}}

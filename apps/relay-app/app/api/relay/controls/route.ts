import { NextResponse,type NextRequest } from "next/server";
import { z } from "zod";
import { getRelaySession } from "@relay-app/src/lib/auth";
import { assertSameOrigin,rateLimit } from "@relay-app/src/lib/security";
const schema=z.object({trackingCode:z.string().regex(/^YBL-[A-Z]{2}-\d{4}-\d{4}$/u),weightKg:z.number().positive().max(300),dimensions:z.object({lengthCm:z.number().positive().max(300),widthCm:z.number().positive().max(300),heightCm:z.number().positive().max(300)}),qualityScore:z.number().int().min(0).max(100),photoCount:z.number().int().min(0).max(20)});
export async function POST(request:NextRequest){try{assertSameOrigin(request);rateLimit(request,120,60_000);const session=await getRelaySession();if(!session)return NextResponse.json({error:"Authentification requise."},{status:401});const control=schema.parse(await request.json());return NextResponse.json({accepted:true,control,requestId:crypto.randomUUID(),synchronized:session.source!=="demo"})}catch(error){return NextResponse.json({error:error instanceof z.ZodError?"Contrôle colis invalide.":"Contrôle refusé."},{status:400})}}

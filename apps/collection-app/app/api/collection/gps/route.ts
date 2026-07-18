import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCollectionSession } from "@collection-app/src/lib/auth";
import { assertSameOrigin, rateLimit } from "@collection-app/src/lib/security";

const gpsSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracyMeters: z.number().min(0).max(5000), speedKph: z.number().min(0).max(220), recordedAt: z.string().datetime() });
export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); rateLimit(request, 300, 60_000); const session=await getCollectionSession(); if (!session) return NextResponse.json({error:"Authentification requise."},{status:401}); const position=gpsSchema.parse(await request.json()); return NextResponse.json({accepted:true,position,requestId:crypto.randomUUID(),synchronized:session.source!=="demo"}); }
  catch(error) { return NextResponse.json({error:error instanceof z.ZodError?"Position GPS invalide.":"Position refusée."},{status:400}); }
}

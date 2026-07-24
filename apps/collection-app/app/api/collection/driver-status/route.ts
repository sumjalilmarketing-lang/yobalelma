import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getCollectionSession } from "@collection-app/src/lib/auth";
import { assertSameOrigin, rateLimit } from "@collection-app/src/lib/security";

const schema = z.object({
  status: z.enum(["mission_accepted","in_transit","arrived_relay","arrived_hub","mission_completed","incident","paused","gps_unavailable"]),
  routeId: z.string().uuid(), vehicleId: z.string().uuid().nullable().optional(), deviceSessionId: z.string().uuid(), reason: z.string().trim().max(240).optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 30, 60_000);
    const session=await getCollectionSession();
    if(!session || session.source!=="supabase" || !session.userId) return NextResponse.json({error:"Authentification professionnelle requise."},{status:401});
    const input=schema.parse(await request.json()); const client=await tryCreateSupabaseServerClient();
    if(!client) return NextResponse.json({error:"Le statut ne peut pas être enregistré pour le moment."},{status:503});
    const rpc=client.rpc as unknown as (name:string,args:Record<string,unknown>)=>Promise<{error:{message:string}|null}>;
    const result=await rpc("set_driver_operational_status",{p_status:input.status,p_mission_id:null,p_collection_route_id:input.routeId,p_vehicle_id:input.vehicleId??null,p_device_session_id:input.deviceSessionId,p_reason:input.reason??null});
    if(result.error) throw new Error(result.error.message);
    return NextResponse.json({recorded:true,status:input.status});
  } catch(error) {
    return NextResponse.json({error:error instanceof z.ZodError?"Statut opérationnel invalide.":"Le changement de statut a été refusé."},{status:error instanceof z.ZodError?400:409});
  }
}

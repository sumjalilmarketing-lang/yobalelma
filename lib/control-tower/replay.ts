import type {ControlEvent} from "./core";
export function buildReplayTimeline(events:ControlEvent[]){
  return events.map((event)=>controlEventSchemaForReplay(event)).sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt)||a.sourceEventId.localeCompare(b.sourceEventId));
}
function controlEventSchemaForReplay(event:ControlEvent){return {sourceModule:event.sourceModule,sourceEventId:event.sourceEventId,eventType:event.eventType,entityType:event.entityType,entityId:event.entityId,countryCode:event.countryCode,occurredAt:event.occurredAt,severity:event.severity,correlationId:event.correlationId??null};}
export function replayStateAt<T>(events:Array<{occurredAt:string;state:T}>,at:string){return events.filter((event)=>event.occurredAt<=at).sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt))[0]?.state??null;}

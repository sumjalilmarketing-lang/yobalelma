import {performance} from "node:perf_hooks";
const count=Number(process.argv[2]||250000); const started=performance.now();
const events=Array.from({length:count},(_,index)=>({id:String(index),country:index%5===0?"CI":"SN",occurredAt:1_750_000_000_000+((index*7919)%count)*1000,severity:index%997===0?"critical":"info"}));
events.sort((a,b)=>a.occurredAt-b.occurredAt||a.id.localeCompare(b.id));
const countries=new Map(); for(const event of events){const current=countries.get(event.country)??{events:0,critical:0};current.events+=1;if(event.severity==="critical")current.critical+=1;countries.set(event.country,current);}
const durationMs=Math.round((performance.now()-started)*100)/100;
console.log(JSON.stringify({events:count,durationMs,eventsPerSecond:Math.round(count/(durationMs/1000)),countries:Object.fromEntries(countries),memoryMb:Math.round(process.memoryUsage().heapUsed/1024/1024)},null,2));

"use client";
import type { RealtimePosition } from "@/lib/geolocation/realtime";

const databaseName = "yobalelma-operational-location-v1";
const storeName = "pending-positions";
const maxItems = 100;

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "clientEventId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueuePosition(position: RealtimePosition) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName); store.put(position);
    const all = store.getAll();
    all.onsuccess = () => all.result.sort((a: RealtimePosition, b: RealtimePosition) => Date.parse(a.recordedAt)-Date.parse(b.recordedAt)).slice(0, Math.max(0, all.result.length-maxItems)).forEach((item: RealtimePosition) => store.delete(item.clientEventId));
    transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function pendingPositions() {
  const db = await database();
  const result = await new Promise<RealtimePosition[]>((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result.filter((item: RealtimePosition) => Date.now()-Date.parse(item.recordedAt)<86_400_000).sort((a: RealtimePosition,b: RealtimePosition)=>Date.parse(a.recordedAt)-Date.parse(b.recordedAt)));
    request.onerror = () => reject(request.error);
  });
  db.close(); return result.slice(0,50);
}

export async function removePositions(ids: string[]) {
  if (!ids.length) return; const db = await database();
  await new Promise<void>((resolve,reject)=>{ const transaction=db.transaction(storeName,"readwrite"); const store=transaction.objectStore(storeName); ids.forEach((id)=>store.delete(id)); transaction.oncomplete=()=>resolve(); transaction.onerror=()=>reject(transaction.error); });
  db.close();
}

"use client";
import { useEffect } from "react";
export function OfflineAgent() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => undefined);
    }
    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("yobalelma-relay-")).map((key) => caches.delete(key)))).catch(() => undefined);
    }
  }, []);
  return null;
}

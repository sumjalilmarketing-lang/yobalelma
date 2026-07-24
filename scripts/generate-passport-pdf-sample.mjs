import { mkdir, writeFile } from "node:fs/promises";
import { buildLogisticsPassportPdf } from "../lib/traceability/passport-pdf.ts";

const target = new URL("../output/pdf/yobalelma-logistics-passport-sample.pdf", import.meta.url);
await mkdir(new URL("../output/pdf/", import.meta.url), { recursive: true });
const events = Array.from({ length: 62 }, (_, index) => [`Événement #${index + 1}`, `parcel_in_transit | étape ${index + 1} | 2026-07-22T10:${String(index % 60).padStart(2, "0")}:00Z | source hub-app | hash ${String(index).padStart(64, "a")}`]);
const pdf = buildLogisticsPassportPdf({
  verificationId: "sample-20260722-verified-layout",
  generatedAt: "2026-07-22T12:00:00Z",
  trackingCode: "YBL-SN-2026-0042",
  status: "in_transit",
  sections: [
    { title: "Identité et itinéraire", rows: [["Colis", "Documents administratifs"], ["Origine", "Dakar, SN"], ["Destination", "Paris, FR"], ["Détenteur", "Voyageur vérifié"]] },
    { title: "Chaîne de possession", rows: events },
    { title: "Preuves vérifiées", rows: [["QR", "Vérifiée"], ["Identité", "Vérifiée"], ["Photo scellé", "Vérifiée"]] },
    { title: "Scellés", rows: [["S-0042", "Intact"]] },
    { title: "Anomalies", rows: [["Aucune", "-"]] },
  ],
});
await writeFile(target, pdf);
console.log(target.pathname);

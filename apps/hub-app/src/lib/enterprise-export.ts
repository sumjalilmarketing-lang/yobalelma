import { z } from "zod";
import type { EnterpriseHubState } from "./enterprise-types";

export const exportQuerySchema = z.object({
  type: z.enum(["inventory", "incidents", "audit", "performance", "manifest", "packing-list", "batch", "inspection"]),
  format: z.enum(["csv", "xlsx", "pdf", "print"]).default("csv"),
  hub: z.string().uuid().or(z.literal("")).optional(),
});

export type ExportTable = { headers: string[]; rows: Array<Array<string | number>>; title: string };

export function createExportTable(state: EnterpriseHubState, type: z.infer<typeof exportQuerySchema>["type"], hubId?: string): ExportTable {
  const allowedCodes = new Set(state.hubs.filter((hub) => !hubId || hub.id === hubId).map((hub) => hub.code));
  if (type === "incidents") return { title: "Yobalelma Hub — Incidents", headers: ["Référence", "Hub", "Titre", "Priorité", "Statut", "Assigné", "Ouvert le"], rows: state.incidents.filter((row) => allowedCodes.has(row.hubCode)).map((row) => [row.code, row.hubCode, row.title, row.priority, row.status, row.assignedTo, row.openedAt]) };
  if (type === "audit") return { title: "Yobalelma Hub — Audit", headers: ["Utilisateur", "Rôle", "Hub", "Action", "Ressource", "Résultat", "Risque", "Corrélation", "Date"], rows: state.audit.filter((row) => allowedCodes.has(row.hubCode)).map((row) => [row.actor, row.role, row.hubCode, row.action, row.resource, row.result, row.risk, row.correlationId, row.occurredAt]) };
  if (type === "performance") return { title: "Yobalelma Hub — Performance", headers: ["Agent", "Hub", "Équipe", "Réceptions", "Inspections", "Mouvements", "Poids kg", "SLA %"], rows: state.agents.filter((row) => allowedCodes.has(row.hubCode)).map((row) => [row.name, row.hubCode, row.team, row.received, row.inspections, row.movements, row.processedWeightKg, row.slaPercent]) };
  if (["manifest", "packing-list", "batch", "inspection"].includes(type)) return { title: `Yobalelma Hub — ${type}`, headers: ["Hub", "Ville", "Pays", "Statut", "Colis", "Poids kg", "Date"], rows: state.hubs.filter((row) => allowedCodes.has(row.code)).map((row) => [row.code, row.city, row.country, row.status, row.inventory, row.storedWeightKg, state.generatedAt]) };
  return { title: "Yobalelma Hub — Inventaire", headers: ["Hub", "Ville", "Pays", "Colis", "Poids kg", "Capacité kg", "Occupation %", "Statut"], rows: state.hubs.filter((row) => allowedCodes.has(row.code)).map((row) => [row.code, row.city, row.country, row.inventory, row.storedWeightKg, row.storageCapacityKg, Math.round(row.storedWeightKg / Math.max(row.storageCapacityKg, 1) * 100), row.status]) };
}

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
export function toCsv(table: ExportTable) { return `\uFEFF${[table.headers, ...table.rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}`; }
const xml = (value: string | number) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export function toExcelXml(table: ExportTable) { const rows = [table.headers, ...table.rows].map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${xml(cell)}</Data></Cell>`).join("")}</Row>`).join(""); return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Hub"><Table>${rows}</Table></Worksheet></Workbook>`; }
const pdfEscape = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?").replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
export function toPdf(table: ExportTable, author: string, timestamp: string) {
  const lines = [table.title, `Auteur: ${author}`, `Date: ${timestamp}`, "", table.headers.join(" | "), ...table.rows.slice(0, 34).map((row) => row.join(" | "))];
  const content = `BT /F1 9 Tf 40 800 Td ${lines.map((line, index) => `${index ? "0 -19 Td " : ""}(${pdfEscape(line).slice(0, 120)}) Tj`).join(" ")} ET`;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let body = "%PDF-1.4\n"; const offsets = [0]; objects.forEach((object, index) => { offsets.push(body.length); body += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const xref = body.length; body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`; return Buffer.from(body, "binary");
}

export function toPrintableHtml(table: ExportTable, author: string, timestamp: string, qrDataUrl = "") { const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${xml(cell)}</td>`).join("")}</tr>`).join(""); return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${xml(table.title)}</title><style>@page{size:A4;margin:16mm}body{font:12px Arial;color:#111}header{border-bottom:4px solid #ff6500;margin-bottom:24px;position:relative}header img{position:absolute;right:0;top:0;width:72px;height:72px}h1{font-size:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#111;color:#fff}.meta{color:#555}.signatures{display:flex;justify-content:space-between;margin-top:60px}.signatures span{border-top:1px solid #111;width:40%;padding-top:8px}@media print{button{display:none}}</style></head><body><header><h1>${xml(table.title)}</h1><p class="meta">Hub Control Center · ${xml(timestamp)} · ${xml(author)}</p>${qrDataUrl ? `<img alt="QR document" src="${qrDataUrl}">` : ""}</header><button onclick="window.print()">Imprimer</button><table><thead><tr>${table.headers.map((header) => `<th>${xml(header)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table><div class="signatures"><span>Signature Hub</span><span>Signature partenaire</span></div></body></html>`; }

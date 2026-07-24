import { describe, expect, it } from "vitest";
import { buildLogisticsPassportPdf } from "@/lib/traceability/passport-pdf";

describe("logistics passport PDF", () => {
  it("generates a paginated A4 PDF with verification id and no foreign parcel", () => {
    const pdf=buildLogisticsPassportPdf({verificationId:"verify-123",generatedAt:"2026-07-22T12:00:00Z",trackingCode:"YBL-ABC12345",status:"in_transit",sections:[{title:"Timeline",rows:Array.from({length:120},(_,index)=>[`Evenement ${index+1}`,`Colis autorise etape ${index+1}`])}]});
    const text=pdf.toString("latin1");
    expect(text.startsWith("%PDF-1.7")).toBe(true); expect(text).toContain("/MediaBox [0 0 595 842]"); expect(text).toContain("verify-123"); expect(text.match(/\/Type \/Page\b/g)?.length).toBeGreaterThan(2); expect(text).not.toContain("AUTRE-COLIS");
  });

  it("never starts a continuation page with an orphaned row fragment", () => {
    const pdf=buildLogisticsPassportPdf({verificationId:"verify-pagination",generatedAt:"2026-07-22T12:00:00Z",trackingCode:"YBL-PAGINATION",status:"in_transit",sections:[{title:"Chaine de possession",rows:Array.from({length:80},(_,index)=>[`Evenement ${index+1}`,`parcel_in_transit | etape ${index+1} | hash ${String(index).padStart(64,"a")}`])},{title:"Preuves verifiees",rows:[["QR","Verifiee"],["Identite","Verifiee"],["Photo scelle","Verifiee"]]}]});
    const streams=[...pdf.toString("latin1").matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((match)=>match[1]).filter((stream)=>stream.includes(" Tj"));
    const firstVisibleLines=streams.map((stream)=>stream.match(/BT\n\/F\d [\d]+ Tf\n0 0 Td\n\((.*)\) Tj/)?.[1]);
    expect(firstVisibleLines[0]).toBe("YOBALELMA - PASSEPORT LOGISTIQUE");
    expect(firstVisibleLines.slice(1).every((line)=>line?.endsWith(" \\(SUITE\\)") || line === "PREUVES VERIFIEES")).toBe(true);
  });
});

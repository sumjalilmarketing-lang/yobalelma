export type PassportPdfSection = { title: string; rows: Array<[string, string]> };

export type PassportPdfInput = {
  verificationId: string;
  generatedAt: string;
  trackingCode: string;
  status: string;
  sections: PassportPdfSection[];
};

const pageWidth = 595;
const pageHeight = 842;
const margin = 48;
const lineHeight = 14;
const maxLinesPerPage = 47;

type PdfLine = {
  style: "body" | "document-title" | "document-subtitle" | "section-title";
  text: string;
};

export function buildLogisticsPassportPdf(input: PassportPdfInput) {
  const pages: PdfLine[][] = [[]];
  const newPage = () => {
    pages.push([]);
  };
  const push = (text = "", style: PdfLine["style"] = "body") => {
    if (pages[pages.length - 1].length >= maxLinesPerPage) newPage();
    pages[pages.length - 1].push({ style, text });
  };
  const continueSection = (title: string) => {
    newPage();
    push(`${title.toUpperCase()} (SUITE)`, "section-title");
  };

  push("YOBALELMA - PASSEPORT LOGISTIQUE", "document-title");
  push(`Colis ${input.trackingCode}`, "document-subtitle");
  push(`Statut: ${input.status}`);
  push(`Genere le: ${formatPdfDate(input.generatedAt)}`);
  push(`Verification: ${input.verificationId}`);
  push();
  for (const section of input.sections) {
    if (pages[pages.length - 1].length > maxLinesPerPage - 3) newPage();
    push(section.title.toUpperCase(), "section-title");
    for (const [label, rawValue] of section.rows) {
      const value = clean(rawValue) || "-";
      const parts = wrap(`${clean(label)}: ${value}`, 88);
      if (pages[pages.length - 1].length + parts.length > maxLinesPerPage) {
        continueSection(section.title);
      }
      for (const [index, part] of parts.entries()) {
        if (pages[pages.length - 1].length >= maxLinesPerPage) {
          continueSection(section.title);
        }
        push(index === 0 ? part : `  ${part}`);
      }
    }
    if (pages[pages.length - 1].length < maxLinesPerPage) push();
  }

  const objects: string[] = [];
  const addObject = (value: string) => { objects.push(value); return objects.length; };
  const catalogId = addObject("");
  const pagesId = addObject("");
  const regularFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const pageIds: number[] = [];

  pages.forEach((lines, pageIndex) => {
    const commands = ["q", "0.12 0.12 0.12 rg", `1 0 0 1 ${margin} ${pageHeight - margin} cm`];
    lines.forEach((line, index) => {
      const y = -(index * lineHeight);
      const isHeading = line.style !== "body";
      const fontSize = line.style === "document-title" ? 16 : isHeading ? 11 : 9;
      commands.push("BT", `/${isHeading ? "F2" : "F1"} ${fontSize} Tf`, `0 ${y} Td`, `(${escapePdf(line.text)}) Tj`, "ET");
    });
    commands.push("BT", "/F1 8 Tf", `0 ${-(pageHeight - margin * 2 - 10)} Td`, `(Page ${pageIndex + 1}/${pages.length} - ${escapePdf(input.verificationId)}) Tj`, "ET", "Q");
    const stream = commands.join("\n");
    const contentId = addObject(`<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.7\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((value, index) => { offsets.push(byteLength(pdf)); pdf += `${index + 1} 0 obj\n${value}\nendobj\n`; });
  const xref = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /ID [<${pdfId(input.verificationId)}> <${pdfId(input.verificationId)}>] >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

function clean(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^ -~]/g, "-").trim(); }
function wrap(value: string, max: number) { const words=clean(value).split(/\s+/);const rows:string[]=[];let row="";for(const word of words){if((`${row} ${word}`).trim().length>max&&row){rows.push(row);row=word;}else row=(`${row} ${word}`).trim();}if(row)rows.push(row);return rows.length?rows:[""]; }
function escapePdf(value: string) { return clean(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)"); }
function byteLength(value: string) { return Buffer.byteLength(value, "latin1"); }
function formatPdfDate(value: string) { const parsed=new Date(value);return Number.isNaN(parsed.getTime())?clean(value):new Intl.DateTimeFormat("fr-FR",{dateStyle:"long",timeStyle:"short",timeZone:"UTC"}).format(parsed); }
function pdfId(value: string) { return Buffer.from(value).toString("hex").slice(0,32).padEnd(32,"0"); }

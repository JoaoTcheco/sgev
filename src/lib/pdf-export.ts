// Utilitário para exportar tabelas em PDF (A4) com jsPDF + autoTable.
// Usado em qualquer sítio que já tenha exportação CSV.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateTime } from "@/lib/format";

export type PdfTableOptions = {
  title: string;
  filename: string;             // nome do ficheiro (sem extensão)
  head: string[];
  body: (string | number)[][];
  subtitle?: string;            // ex.: resumo de filtros
  orientation?: "portrait" | "landscape";
  footerNote?: string;
};

export function exportTablePDF(opts: PdfTableOptions) {
  const doc = new jsPDF({ orientation: opts.orientation ?? "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 32;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(opts.title, marginX, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`Gerado em: ${formatDateTime(new Date())}`, pageW - marginX, 40, { align: "right" });

  let cursorY = 58;
  if (opts.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(60);
    const wrapped = doc.splitTextToSize(opts.subtitle, pageW - marginX * 2);
    doc.text(wrapped, marginX, cursorY);
    cursorY += wrapped.length * 11 + 6;
  }

  autoTable(doc, {
    head: [opts.head],
    body: opts.body.map((row) => row.map((c) => (c == null ? "" : String(c)))),
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(120);
      const pageNum = doc.getNumberOfPages();
      const footer = opts.footerNote ? `${opts.footerNote} · página ${pageNum}` : `Página ${pageNum}`;
      doc.text(footer, pageW - marginX, pageH - 16, { align: "right" });
      doc.text("PharmaSys", marginX, pageH - 16);
    },
  });

  doc.save(`${opts.filename}.pdf`);
}

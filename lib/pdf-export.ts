// lib/pdf-export.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfExpenseItem {
  name: string;
  price: number;
  quantity: number;
}

export interface PdfExpense {
  date: Date;
  note?: string | null;
  total: number;
  payerName: string;
  items: PdfExpenseItem[];
}

export interface PdfProjectReport {
  projectName: string;
  currency: string;
  period: string;
  participants: { name: string; total: number }[];
  expenses: PdfExpense[];
  settlements: { from: string; to: string; amount: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const LINE_H = 18;

const C_DARK = rgb(0.1, 0.1, 0.1);
const C_ACCENT = rgb(0.04, 0.52, 0.91); // brand-600-ish
const C_MUTED = rgb(0.5, 0.5, 0.5);
const C_LIGHT_BG = rgb(0.96, 0.97, 0.98);
const C_ROW_ALT = rgb(0.85, 0.92, 0.98);
const C_WHITE = rgb(1, 1, 1);

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generateProjectPDF(
  data: PdfProjectReport
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const newPage = () => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  const checkY = (needed = LINE_H * 3) => {
    if (y < MARGIN + needed) newPage();
  };

  const drawText = (
    str: string,
    x: number,
    size = 11,
    color = C_DARK,
    font = regularFont
  ) => {
    page.drawText(str, { x, y, size, color, font });
  };

  const drawRect = (
    x: number,
    rectY: number,
    width: number,
    height: number,
    color = C_LIGHT_BG
  ) => {
    page.drawRectangle({ x, y: rectY, width, height, color });
  };

  // ── Header band ──────────────────────────────────────────────────────────

  drawRect(0, PAGE_H - 90, PAGE_W, 90, C_ACCENT);

  page.drawText("MY LEDGER", {
    x: MARGIN,
    y: PAGE_H - 38,
    size: 22,
    font: boldFont,
    color: C_WHITE,
  });
  page.drawText(`Project: ${data.projectName}`, {
    x: MARGIN,
    y: PAGE_H - 60,
    size: 13,
    font: regularFont,
    color: rgb(0.9, 0.95, 1),
  });
  page.drawText(`Period: ${data.period}`, {
    x: MARGIN,
    y: PAGE_H - 78,
    size: 10,
    font: regularFont,
    color: rgb(0.8, 0.9, 1),
  });

  y = PAGE_H - 110;

  // ── Participant Summary ──────────────────────────────────────────────────

  drawText("PARTICIPANT SUMMARY", MARGIN, 12, C_ACCENT, boldFont);
  y -= LINE_H + 4;

  const totalOverall = data.participants.reduce((s, p) => s + p.total, 0);

  for (const p of data.participants) {
    checkY();
    drawRect(MARGIN, y - 4, PAGE_W - MARGIN * 2, LINE_H);
    drawText(p.name, MARGIN + 8, 11, C_DARK, boldFont);
    drawText(
      formatCurrency(p.total, data.currency),
      PAGE_W - MARGIN - 90,
      11,
      C_DARK
    );
    y -= LINE_H + 2;
  }

  // Divider + grand total
  y -= 4;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: C_ACCENT,
  });
  y -= LINE_H;
  drawText("TOTAL", MARGIN + 8, 12, C_ACCENT, boldFont);
  drawText(
    formatCurrency(totalOverall, data.currency),
    PAGE_W - MARGIN - 90,
    12,
    C_ACCENT,
    boldFont
  );
  y -= LINE_H * 2;

  // ── Settlement Guide ─────────────────────────────────────────────────────

  if (data.settlements.length > 0) {
    checkY();
    drawText("SETTLEMENT GUIDE", MARGIN, 12, C_ACCENT, boldFont);
    y -= LINE_H + 4;

    for (const s of data.settlements) {
      checkY();
      drawText(
        `${s.from}  →  ${s.to}     ${formatCurrency(s.amount, data.currency)}`,
        MARGIN + 8,
        11,
        C_DARK
      );
      y -= LINE_H;
    }
    y -= LINE_H;
  }

  // ── Expense Details ──────────────────────────────────────────────────────

  checkY(LINE_H * 4);
  drawText("EXPENSE DETAILS", MARGIN, 12, C_ACCENT, boldFont);
  y -= LINE_H + 4;

  for (const exp of data.expenses) {
    checkY(LINE_H * (exp.items.length + 3));

    // Expense header row
    drawRect(MARGIN, y - 4, PAGE_W - MARGIN * 2, LINE_H + 4, C_ROW_ALT);
    drawText(formatDate(exp.date), MARGIN + 8, 10, C_DARK, boldFont);
    drawText(`Paid by: ${exp.payerName}`, MARGIN + 120, 10, C_MUTED);
    drawText(
      formatCurrency(exp.total, data.currency),
      PAGE_W - MARGIN - 90,
      10,
      C_DARK,
      boldFont
    );
    y -= LINE_H + 4;

    if (exp.note) {
      drawText(`"${exp.note}"`, MARGIN + 12, 9, C_MUTED);
      y -= LINE_H;
    }

    for (const item of exp.items) {
      checkY();
      drawText(`  • ${item.name}`, MARGIN + 12, 10, C_DARK);
      drawText(
        `×${item.quantity}   ${formatCurrency(item.price, data.currency)}`,
        PAGE_W - MARGIN - 90,
        10,
        C_MUTED
      );
      y -= LINE_H - 2;
    }

    y -= 8;
  }

  // ── Footer on every page ─────────────────────────────────────────────────

  const pages = pdfDoc.getPages();
  const total = pages.length;
  const generatedOn = new Date().toLocaleDateString("en-IN");

  pages.forEach((p, i) => {
    p.drawText(`My Ledger  ·  Page ${i + 1} of ${total}`, {
      x: MARGIN,
      y: 22,
      size: 9,
      color: C_MUTED,
      font: regularFont,
    });
    p.drawText(`Generated: ${generatedOn}`, {
      x: PAGE_W - 160,
      y: 22,
      size: 9,
      color: C_MUTED,
      font: regularFont,
    });
  });

  return pdfDoc.save();
}

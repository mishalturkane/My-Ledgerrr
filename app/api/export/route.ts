// app/api/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateProjectPDF } from "@/lib/pdf-export";
import { calculateSettlements } from "@/lib/utils";
import {
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  startOfWeek, endOfWeek,
  format,
} from "date-fns";

/**
 * GET /api/export?projectId=...&type=weekly|monthly|yearly&date=<ISO>
 * Streams a PDF file for download.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type") ?? "monthly";
  const dateStr = searchParams.get("date") ?? new Date().toISOString();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id },
      include: { participants: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const refDate = new Date(dateStr);
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    switch (type) {
      case "weekly":
        startDate = startOfWeek(refDate, { weekStartsOn: 1 });
        endDate = endOfWeek(refDate, { weekStartsOn: 1 });
        periodLabel = `Week of ${format(startDate, "dd MMM yyyy")}`;
        break;
      case "yearly":
        startDate = startOfYear(refDate);
        endDate = endOfYear(refDate);
        periodLabel = format(refDate, "yyyy");
        break;
      default: // monthly
        startDate = startOfMonth(refDate);
        endDate = endOfMonth(refDate);
        periodLabel = format(refDate, "MMMM yyyy");
    }

    const expenses = await prisma.expense.findMany({
      where: { projectId, date: { gte: startDate, lte: endDate } },
      include: { items: true, payer: true },
      orderBy: { date: "asc" },
    });

    // Per-participant totals for this period
    const participantTotals = project.participants.map((p) => {
      const total = expenses
        .filter((e) => e.payerId === p.id)
        .reduce((sum, e) => sum + Number(e.total), 0);
      return { name: p.name, total };
    });

    const grandTotal = participantTotals.reduce((s, p) => s + p.total, 0);
    const count = project.participants.length;
    const perHead = count > 0 ? grandTotal / count : 0;

    const balances: Record<string, number> = {};
    for (const p of participantTotals) {
      balances[p.name] = p.total - perHead;
    }
    const settlements = calculateSettlements(balances);

    const pdfBytes = await generateProjectPDF({
      projectName: project.name,
      currency: project.currency,
      period: periodLabel,
      participants: participantTotals,
      expenses: expenses.map((e) => ({
        date: e.date,
        note: e.note,
        total: Number(e.total),
        payerName: e.payer.name,
        items: e.items.map((i) => ({
          name: i.name,
          price: Number(i.price),
          quantity: i.quantity,
        })),
      })),
      settlements,
    });

    const filename = `${project.name.replace(/\s+/g, "_")}_${type}_${format(refDate, "yyyy-MM")}.pdf`;

   
return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (err) {
    console.error("[GET /api/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

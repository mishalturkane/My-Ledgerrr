// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

/** GET /api/projects/:id — full project with expenses and aggregations */
export async function GET(req: NextRequest, { params }: Params) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        participants: { orderBy: { name: "asc" } },
        expenses: {
          include: { items: true, payer: true },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Per-participant totals
    const participantTotals = project.participants.map((p) => {
      const total = project.expenses
        .filter((e) => e.payerId === p.id)
        .reduce((sum, e) => sum + Number(e.total), 0);
      return { ...p, total };
    });

    // Daily aggregation for charts
    const dailyMap = new Map<string, number>();
    for (const e of project.expenses) {
      const key = e.date.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(e.total));
    }
    const dailyTotals = Array.from(dailyMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const grandTotal = project.expenses.reduce(
      (s, e) => s + Number(e.total),
      0
    );

    return NextResponse.json({
      ...project,
      participantTotals,
      dailyTotals,
      grandTotal,
    });
  } catch (err) {
    console.error("[GET /api/projects/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH /api/projects/:id — update name or description */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, ownerId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: body.name ?? project.name,
        description: body.description ?? project.description,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/projects/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/projects/:id — delete a project (cascades to expenses) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, ownerId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/projects/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

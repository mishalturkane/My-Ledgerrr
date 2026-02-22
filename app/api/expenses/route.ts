// app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateExpenseSchema, ExpenseFilterSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/expenses
 * Query params: projectId (required), page, pageSize, search, payerId, startDate, endDate
 */
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = ExpenseFilterSchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, startDate, endDate, payerId, search, page, pageSize } =
      parsed.data;

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const where = {
      projectId,
      ...(payerId ? { payerId } : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { note: { contains: search, mode: "insensitive" as const } },
              {
                items: {
                  some: {
                    name: { contains: search, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { items: true, payer: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("[GET /api/expenses]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/expenses — create a new expense with items */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, payerId, date, note, items } = parsed.data;

    // Verify ownership + participant belongs to project
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id },
      include: { participants: { select: { id: true } } },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const participantExists = project.participants.some((p) => p.id === payerId);
    if (!participantExists) {
      return NextResponse.json(
        { error: "Payer is not a participant of this project" },
        { status: 400 }
      );
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const expense = await prisma.expense.create({
      data: {
        projectId,
        payerId,
        date: new Date(date),
        note: note ?? null,
        total,
        createdById: session.user.id,
        items: {
          create: items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true, payer: true },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error("[POST /api/expenses]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/expenses?id=<expenseId> — delete a single expense */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
  }

  try {
    // Ensure the expense belongs to a project owned by this user
    const expense = await prisma.expense.findFirst({
      where: { id },
      include: { project: { select: { ownerId: true } } },
    });

    if (!expense || expense.project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/expenses]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

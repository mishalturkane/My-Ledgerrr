// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateProjectSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/projects — list all projects owned by the authenticated user */
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      include: {
        participants: { orderBy: { name: "asc" } },
        _count: { select: { expenses: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute total spent per project
    const projectsWithTotals = await Promise.all(
      projects.map(async (project) => {
        const agg = await prisma.expense.aggregate({
          where: { projectId: project.id },
          _sum: { total: true },
        });
        return { ...project, totalSpent: Number(agg._sum.total ?? 0) };
      })
    );

    return NextResponse.json(projectsWithTotals);
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/projects — create a new project */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, currency, participants } = parsed.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        currency,
        ownerId: session.user.id,
        participants: {
          create: participants.map((pName) => ({ name: pName })),
        },
      },
      include: { participants: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

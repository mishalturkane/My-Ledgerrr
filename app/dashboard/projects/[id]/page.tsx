// app/dashboard/projects/[id]/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, calculateSettlements } from "@/lib/utils";
import Link from "next/link";
import { PlusCircle, ArrowLeft, Users, TrendingUp } from "lucide-react";
import { ExportButton } from "@/components/projects/ExportButton";
import { DeleteExpenseButton } from "@/components/expenses/DeleteExpenseButton";
import { ExpenseSearchFilter } from "@/components/expenses/ExpenseSearchFilter";

interface SearchParams {
  search?: string;
  payerId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const sp = await searchParams;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { participants: { orderBy: { name: "asc" } } },
  });
  if (!project) notFound();

  // Build filter WHERE clause
  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 20;

  const where: Record<string, unknown> = { projectId: id };
  if (sp.payerId) where.payerId = sp.payerId;
  if (sp.startDate || sp.endDate) {
    where.date = {
      ...(sp.startDate ? { gte: new Date(sp.startDate) } : {}),
      ...(sp.endDate ? { lte: new Date(sp.endDate) } : {}),
    };
  }
  if (sp.search) {
    where.OR = [
      { note: { contains: sp.search, mode: "insensitive" } },
      { items: { some: { name: { contains: sp.search, mode: "insensitive" } } } },
    ];
  }

  const [expenses, totalExpenses] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { items: true, payer: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  // All-time per-participant totals (ignores filters, for summary cards)
  const allExpenses = await prisma.expense.findMany({
    where: { projectId: id },
    select: { payerId: true, total: true },
  });

  const participantTotals = project.participants.map((p) => {
    const total = allExpenses
      .filter((e) => e.payerId === p.id)
      .reduce((sum, e) => sum + Number(e.total), 0);
    return { ...p, total };
  });

  const grandTotal = participantTotals.reduce((s, p) => s + p.total, 0);
  const perHead = project.participants.length > 0
    ? grandTotal / project.participants.length
    : 0;

  const balances: Record<string, number> = {};
  for (const p of participantTotals) {
    balances[p.name] = p.total - perHead;
  }
  const settlements = calculateSettlements(balances);
  const totalPages = Math.ceil(totalExpenses / pageSize);

  // Build pagination URL helper
  const paginationHref = (p: number) => {
    const parts: string[] = [`page=${p}`];
    if (sp.search) parts.push(`search=${encodeURIComponent(sp.search)}`);
    if (sp.payerId) parts.push(`payerId=${sp.payerId}`);
    if (sp.startDate) parts.push(`startDate=${sp.startDate}`);
    if (sp.endDate) parts.push(`endDate=${sp.endDate}`);
    return `?${parts.join("&")}`;
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> All Projects
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-800 dark:text-white">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ExportButton projectId={project.id} />
            <Link href={`/dashboard/projects/${id}/expenses/new`} className="btn-primary">
              <PlusCircle size={18} /> Add Expense
            </Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Grand Total", value: formatCurrency(grandTotal, project.currency) },
          { label: "Per Head", value: formatCurrency(perHead, project.currency) },
          { label: "Total Entries", value: String(totalExpenses) },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {label}
            </p>
            <p className="font-mono font-bold text-2xl text-slate-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Participant Summary + Settlement Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Participant totals */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users size={18} className="text-brand-500" />
            <h2 className="font-display font-bold text-slate-800 dark:text-white">
              Participant Summary
            </h2>
          </div>
          <div className="space-y-3">
            {participantTotals.map((p) => {
              const pct = grandTotal > 0 ? (p.total / grandTotal) * 100 : 0;
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.total, project.currency)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {pct.toFixed(1)}% of total
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settlement guide */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-emerald-500" />
            <h2 className="font-display font-bold text-slate-800 dark:text-white">
              Settlement Guide
            </h2>
          </div>
          {settlements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Everyone&apos;s settled up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800"
                >
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">{s.from}</span>
                  <span className="text-amber-500 text-xs">→ owes →</span>
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">{s.to}</span>
                  <span className="ml-auto font-mono font-bold text-sm text-amber-700 dark:text-amber-300">
                    {formatCurrency(s.amount, project.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense list */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-slate-800 dark:text-white">
            Expense Entries
          </h2>
          <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {totalExpenses} total
          </span>
        </div>

        <ExpenseSearchFilter participants={project.participants} projectId={id} />

        <div className="mt-4 space-y-3">
          {expenses.length === 0 ? (
            <p className="text-center py-10 text-slate-400 dark:text-slate-500">
              No expenses found. Adjust filters or add one!
            </p>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(expense.date)}
                      </span>
                      <span className="badge bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                        {expense.payer.name}
                      </span>
                      {expense.note && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                          &quot;{expense.note}&quot;
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {expense.items.map((item) => (
                        <span
                          key={item.id}
                          className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg px-2.5 py-1"
                        >
                          {item.name}
                          {item.quantity > 1 && ` ×${item.quantity}`} —{" "}
                          {formatCurrency(Number(item.price), project.currency)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(Number(expense.total), project.currency)}
                    </span>
                    <DeleteExpenseButton expenseId={expense.id} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={paginationHref(page - 1)} className="btn-secondary text-sm">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={paginationHref(page + 1)} className="btn-primary text-sm">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

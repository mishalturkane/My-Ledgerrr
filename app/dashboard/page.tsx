// app/dashboard/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, getGreeting } from "@/lib/utils";
import { ArrowRight, FolderOpen, PlusCircle, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Recent projects (max 5)
  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    include: {
      participants: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // All-time total
  const totalAgg = await prisma.expense.aggregate({
    where: { project: { ownerId: userId } },
    _sum: { total: true },
  });

  // This month's total
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthAgg = await prisma.expense.aggregate({
    where: {
      project: { ownerId: userId },
      date: { gte: startOfMonth },
    },
    _sum: { total: true },
  });

  // Latest 5 expenses across all projects
  const recentExpenses = await prisma.expense.findMany({
    where: { project: { ownerId: userId } },
    include: { payer: true, project: { select: { name: true } }, items: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  const grandTotal = Number(totalAgg._sum.total ?? 0);
  const monthTotal = Number(monthAgg._sum.total ?? 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display font-bold text-3xl text-slate-800 dark:text-white">
          Good {getGreeting()},{" "}
          <span className="text-brand-600 dark:text-brand-400">
            {session.user.name?.split(" ")[0]}
          </span>{" "}
          👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Here&apos;s what&apos;s happening with your ledgers
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Spent (All Time)" value={formatCurrency(grandTotal)} icon="💰" color="brand" />
        <StatCard label="This Month" value={formatCurrency(monthTotal)} icon="📅" color="emerald" />
        <StatCard label="Active Projects" value={String(projects.length)} icon="📁" color="violet" />
      </div>

      {/* Projects + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white">
              Your Projects
            </h2>
            <Link
              href="/dashboard/projects"
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-10">
              <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">No projects yet</p>
              <Link href="/dashboard/projects/new" className="btn-primary text-sm">
                <PlusCircle size={16} /> Create Project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/40 rounded-xl flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm flex-shrink-0">
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {project.participants.length} participants · {project._count.expenses} expenses
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-5">
            Recent Expenses
          </h2>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    🧾
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                      {expense.items.map((i) => i.name).join(", ")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {expense.project.name} · {expense.payer.name} · {formatDate(expense.date)}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-sm text-slate-700 dark:text-slate-300 flex-shrink-0">
                    {formatCurrency(Number(expense.total))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "brand" | "emerald" | "violet";
}) {
  const colorMap = {
    brand:   "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
    violet:  "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300",
  };

  return (
    <div className="card p-5">
      <span className={`inline-block text-2xl p-2 rounded-xl mb-3 ${colorMap[color]}`}>
        {icon}
      </span>
      <p className="font-mono font-bold text-2xl text-slate-800 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

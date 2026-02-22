// app/dashboard/projects/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle, Users, Receipt, Calendar } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    include: {
      participants: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const projectsWithTotals = await Promise.all(
    projects.map(async (project) => {
      const agg = await prisma.expense.aggregate({
        where: { projectId: project.id },
        _sum: { total: true },
      });
      return { ...project, totalSpent: Number(agg._sum.total ?? 0) };
    })
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-slate-800 dark:text-white">
            Projects
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {projects.length} ledger{projects.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/dashboard/projects/new" className="btn-primary">
          <PlusCircle size={18} /> New Project
        </Link>
      </div>

      {/* Grid */}
      {projectsWithTotals.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📒</div>
          <h2 className="font-display font-bold text-xl text-slate-700 dark:text-slate-200 mb-2">
            No projects yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Create your first ledger project to start tracking expenses
          </p>
          <Link href="/dashboard/projects/new" className="btn-primary inline-flex mx-auto">
            <PlusCircle size={18} /> Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {projectsWithTotals.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="card p-5 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/40 rounded-2xl flex items-center justify-center font-display font-bold text-brand-700 dark:text-brand-300 mb-4 group-hover:scale-110 transition-transform">
                {project.name.slice(0, 2).toUpperCase()}
              </div>

              <h3 className="font-display font-bold text-slate-800 dark:text-white text-lg mb-1 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {project.name}
              </h3>

              {project.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              <p className="font-mono font-bold text-2xl text-slate-800 dark:text-white mb-4">
                {formatCurrency(project.totalSpent, project.currency)}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {project.participants.length}
                </span>
                <span className="flex items-center gap-1">
                  <Receipt size={13} />
                  {project._count.expenses} expenses
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Calendar size={13} />
                  {formatDate(project.createdAt)}
                </span>
              </div>
            </Link>
          ))}

          {/* Add new card */}
          <Link
            href="/dashboard/projects/new"
            className="card p-5 border-dashed border-2 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-600 transition-all duration-200 group min-h-[180px]"
          >
            <PlusCircle size={32} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">New Project</span>
          </Link>
        </div>
      )}
    </div>
  );
}

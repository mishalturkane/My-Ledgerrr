"use client";
// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";
import { LayoutDashboard, FolderOpen, PlusCircle, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/projects", icon: FolderOpen, label: "Projects", exact: false },
] as const;

export function Sidebar({ user }: { user?: User }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm shadow-brand-500/30">
          <span className="text-white font-bold text-sm" aria-hidden>₹</span>
        </div>
        <span className="font-display font-bold text-slate-800 dark:text-white">My Ledger</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                size={18}
                className={active ? "text-brand-600 dark:text-brand-400" : ""}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150 mt-2"
        >
          <PlusCircle size={18} aria-hidden />
          New Project
        </Link>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User avatar"}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center">
              <span className="text-brand-700 dark:text-brand-300 font-semibold text-sm">
                {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-150"
        >
          <LogOut size={16} aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}

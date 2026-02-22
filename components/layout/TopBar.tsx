"use client";
// components/layout/TopBar.tsx
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toggleDarkMode, toggleSidebar } from "@/store/slices/uiSlice";
import { Moon, Sun, Menu } from "lucide-react";
import Image from "next/image";
import type { User } from "next-auth";
import { useEffect } from "react";

export function TopBar({ user }: { user?: User }) {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((s) => s.ui.darkMode);

  // Sync dark mode class with <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 lg:px-8">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="lg:hidden btn-ghost p-2 rounded-xl"
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 lg:flex-none" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="btn-ghost p-2.5 rounded-xl"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
        </button>

        {/* User avatar */}
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User avatar"}
            width={34}
            height={34}
            className="rounded-full ring-2 ring-slate-100 dark:ring-slate-700"
          />
        ) : (
          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center">
            <span className="text-brand-700 dark:text-brand-300 text-xs font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

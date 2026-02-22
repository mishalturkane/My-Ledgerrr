// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 flex flex-col items-center justify-center p-6 text-white">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl text-center animate-fade-in">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-10">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-bold text-lg" aria-hidden>₹</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">My Ledger</span>
        </div>

        <h1 className="font-display font-black text-5xl sm:text-7xl leading-none tracking-tight mb-6">
          Split expenses,
          <br />
          <span className="text-brand-400">not friendships.</span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
          Create ledger projects, add participants, track every rupee with
          automatic calculations and one-click PDF reports.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {[
            "📊 Smart Calculations",
            "👥 Multi-Participant",
            "📄 PDF Export",
            "🔍 Full-text Search",
            "🌙 Dark Mode",
          ].map((f) => (
            <span
              key={f}
              className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-slate-300"
            >
              {f}
            </span>
          ))}
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-200 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 active:scale-100"
        >
          {/* Google icon */}
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Link>

        <p className="text-slate-600 text-sm mt-8">Free to use · No credit card required</p>
      </div>
    </main>
  );
}

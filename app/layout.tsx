// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "My Ledger – Shared Expense Tracker",
  description:
    "Track shared expenses with ledger projects, automatic settlement calculations, and one-click PDF reports.",
  keywords: ["expense tracker", "shared expenses", "budget", "split bills"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-surface text-slate-800 dark:bg-surface-dark dark:text-slate-100 antialiased min-h-screen" suppressHydrationWarning> 
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

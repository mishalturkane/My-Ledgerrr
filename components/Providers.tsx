"use client";
// components/Providers.tsx
import { Provider } from "react-redux";
import { store } from "@/store";
import { SessionProvider } from "next-auth/react";

/**
 * Wraps the app with Redux and NextAuth session providers.
 * In NextAuth v5 the SessionProvider does NOT need a session prop —
 * it fetches the session automatically via /api/auth/session.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>{children}</Provider>
    </SessionProvider>
  );
}

// lib/rate-limit.ts
// In-memory rate limiter — works with both Node.js and Bun runtimes.
// For production at scale, swap with Upstash Redis (@upstash/ratelimit).

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1-minute window
const MAX_REQUESTS = 60;  // requests per window per IP

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/**
 * Returns a 429 NextResponse if the IP is over the limit, otherwise null.
 * Call at the top of every API route handler.
 */
export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = getIp(req);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests – please slow down." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  return null;
}

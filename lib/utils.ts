// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names safely. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as currency using Intl. */
export function formatCurrency(
  amount: number | string,
  currency = "INR"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Format a Date or ISO string to a human-readable date. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Get first two uppercase initials from a name. */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Time-of-day greeting string. */
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/**
 * Minimum-transfer settlement algorithm.
 * Given a map of { name → balance } where positive = owed, negative = owes,
 * returns the smallest list of transfers to zero all balances.
 */
export function calculateSettlements(
  balances: Record<string, number>
): { from: string; to: string; amount: number }[] {
  const EPS = 0.01; // ignore floating-point dust below 1 paisa

  const creditors: [string, number][] = Object.entries(balances)
    .filter(([, v]) => v > EPS)
    .sort((a, b) => b[1] - a[1]);

  const debtors: [string, number][] = Object.entries(balances)
    .filter(([, v]) => v < -EPS)
    .sort((a, b) => a[1] - b[1]);

  const settlements: { from: string; to: string; amount: number }[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const [creditorName, credit] = creditors[ci];
    const [debtorName, debt] = debtors[di];
    const transfer = Math.min(credit, Math.abs(debt));

    settlements.push({
      from: debtorName,
      to: creditorName,
      amount: Math.round(transfer * 100) / 100,
    });

    creditors[ci] = [creditorName, credit - transfer];
    debtors[di] = [debtorName, debt + transfer];

    if (creditors[ci][1] < EPS) ci++;
    if (Math.abs(debtors[di][1]) < EPS) di++;
  }

  return settlements;
}

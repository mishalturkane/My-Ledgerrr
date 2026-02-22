"use client";
// components/expenses/ExpenseSearchFilter.tsx
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import { Search, X } from "lucide-react";

interface Participant {
  id: string;
  name: string;
}

interface Props {
  participants: Participant[];
  projectId: string; // kept for future use (e.g. prefetch)
}

export function ExpenseSearchFilter({ participants }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value) {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
      sp.delete("page"); // reset to page 1 on any filter change
      router.push(`${pathname}?${sp.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("search", value), 400);
  };

  const clearAll = () => router.push(pathname);

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("payerId") ||
    searchParams.has("startDate") ||
    searchParams.has("endDate");

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search box */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="input pl-9"
          placeholder="Search items or notes…"
          aria-label="Search expenses"
        />
      </div>

      {/* Payer filter */}
      <select
        defaultValue={searchParams.get("payerId") ?? ""}
        onChange={(e) => updateParam("payerId", e.target.value)}
        className="input w-auto"
        aria-label="Filter by payer"
      >
        <option value="">All Payers</option>
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Start date */}
      <input
        type="date"
        defaultValue={searchParams.get("startDate")?.slice(0, 10) ?? ""}
        onChange={(e) =>
          updateParam(
            "startDate",
            e.target.value ? new Date(e.target.value).toISOString() : ""
          )
        }
        className="input w-auto"
        aria-label="Start date filter"
        title="From date"
      />

      {/* End date */}
      <input
        type="date"
        defaultValue={searchParams.get("endDate")?.slice(0, 10) ?? ""}
        onChange={(e) =>
          updateParam(
            "endDate",
            e.target.value ? new Date(e.target.value).toISOString() : ""
          )
        }
        className="input w-auto"
        aria-label="End date filter"
        title="To date"
      />

      {/* Clear all */}
      {hasFilters && (
        <button onClick={clearAll} className="btn-ghost text-sm gap-1">
          <X size={14} aria-hidden /> Clear
        </button>
      )}
    </div>
  );
}

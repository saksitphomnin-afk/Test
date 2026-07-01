"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { STATUS_ORDER, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SearchFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeStatus = params.get("status") ?? "";

  function apply(next: { q?: string; status?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) {
      if (next.q) sp.set("q", next.q);
      else sp.delete("q");
    }
    if (next.status !== undefined) {
      if (next.status) sp.set("status", next.status);
      else sp.delete("status");
    }
    startTransition(() => router.push(`/?${sp.toString()}`));
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา โครงการ / เลขห้อง / เจ้าของ / เบอร์โทร"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          ค้นหา
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="ทั้งหมด"
          active={activeStatus === ""}
          onClick={() => apply({ status: "" })}
        />
        {STATUS_ORDER.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_META[s].label}
            active={activeStatus === s}
            onClick={() => apply({ status: activeStatus === s ? "" : s })}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition",
        active
          ? "bg-brand-600 text-white ring-brand-600"
          : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50",
      )}
    >
      {label}
    </button>
  );
}
